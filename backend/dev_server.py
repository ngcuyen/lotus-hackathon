"""
Local dev server for Sketch → Living App.
Runs on port 4000, proxied by Vite on port 3000.

Supports two AI backends:
  1. Anthropic API directly (set ANTHROPIC_API_KEY in .env)
  2. AWS Bedrock (set up via `aws configure`)

Usage:
    pip install flask flask-cors boto3 anthropic python-dotenv
    python dev_server.py
"""

import json
import time
import base64
import logging
import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

# Add lambda dir to path so we can import prompts
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lambda"))
from prompts import (
    SYSTEM_PROMPT, build_messages, get_system_prompt,
    STYLE_PRESETS, PURPOSE_INTENTS,
    ANALYZE_SKETCH_SYSTEM_PROMPT, build_analysis_messages,
)

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TOKENS = 8192  # Increased from 4096 — complex UIs need 150-250 lines of JSX
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# ─── Choose backend: OpenAI / Anthropic API / Bedrock ───
if OPENAI_API_KEY:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    MODEL_ID = os.environ.get("MODEL_ID", "gpt-4o")
    BACKEND = "openai"
    logger.info(f"Using OpenAI API (model: {MODEL_ID})")
elif ANTHROPIC_API_KEY:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    MODEL_ID = os.environ.get("MODEL_ID", "claude-sonnet-4-20250514")
    BACKEND = "anthropic"
    logger.info(f"Using Anthropic API (model: {MODEL_ID})")
else:
    import boto3
    client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
    BACKEND = "bedrock"
    logger.info(f"Using AWS Bedrock (model: {MODEL_ID})")


def _call_openai(messages, system_prompt=SYSTEM_PROMPT, max_tokens=None):
    """Call OpenAI API. Convert Anthropic message format to OpenAI format."""
    tokens = max_tokens or MAX_TOKENS
    oai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        content = msg["content"]
        if isinstance(content, str):
            oai_messages.append({"role": msg["role"], "content": content})
        elif isinstance(content, list):
            parts = []
            for block in content:
                if block.get("type") == "text":
                    parts.append({"type": "text", "text": block["text"]})
                elif block.get("type") == "image":
                    b64 = block["source"]["data"]
                    media = block["source"]["media_type"]
                    parts.append({"type": "image_url", "image_url": {"url": f"data:{media};base64,{b64}"}})
            oai_messages.append({"role": msg["role"], "content": parts})
    response = client.chat.completions.create(
        model=MODEL_ID, messages=oai_messages, max_tokens=tokens, temperature=0.3,
    )
    return response.choices[0].message.content


def _call_anthropic(messages, system_prompt=SYSTEM_PROMPT, max_tokens=None):
    """Call Anthropic API directly."""
    tokens = max_tokens or MAX_TOKENS
    response = client.messages.create(
        model=MODEL_ID, system=system_prompt, messages=messages,
        max_tokens=tokens, temperature=0.3,
    )
    return response.content[0].text


def _call_bedrock(messages, system_prompt=SYSTEM_PROMPT, max_tokens=None):
    """Call AWS Bedrock."""
    tokens = max_tokens or MAX_TOKENS
    response = client.invoke_model(
        modelId=MODEL_ID, contentType="application/json", accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31", "system": system_prompt,
            "messages": messages, "max_tokens": tokens, "temperature": 0.3,
        }),
    )
    response_body = json.loads(response["body"].read())
    return response_body["content"][0]["text"]


def _call_ai(messages):
    return _call_ai_with_prompt(messages, SYSTEM_PROMPT)


def _call_ai_with_prompt(messages, system_prompt, max_tokens=None):
    if BACKEND == "openai":
        return _call_openai(messages, system_prompt, max_tokens=max_tokens)
    elif BACKEND == "anthropic":
        return _call_anthropic(messages, system_prompt, max_tokens=max_tokens)
    return _call_bedrock(messages, system_prompt, max_tokens=max_tokens)


def _parse_analysis(raw_text: str):
    """
    Parse the sketch analysis JSON from agent step 1.
    Returns None on failure — non-fatal, pipeline falls back to single-call.
    """
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    try:
        data = json.loads(text)
        if "element_count" in data and "layout" in data:
            return data
        logger.warning(f"[AGENT] Analysis JSON missing required fields: {list(data.keys())}")
        return None
    except json.JSONDecodeError as e:
        logger.warning(f"[AGENT] Analysis parse failed: {e} | raw: {text[:200]}")
        return None


@app.route("/api/generate", methods=["POST"])
def generate():
    """
    2-step agent pipeline:
      Step 1 — Analyze sketch (dedicated vision call, ~600 tokens output)
      Step 2 — Generate code (grounded in analysis, up to 3 retry attempts)

    Falls back gracefully to single-call if analysis fails.
    """
    body = request.json
    image_base64 = body.get("image_base64")
    previous_code = body.get("previous_code")
    modification = body.get("modification")
    style = body.get("style", "modern")
    purpose = body.get("purpose")

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    total_start = time.time()
    system_prompt = get_system_prompt(style)

    try:
        # ── AGENT STEP 1: Analyze sketch ──────────────────────────────────────
        # Skip analysis for text-only modifications (image hasn't changed)
        sketch_analysis = None
        is_text_only_modification = bool(previous_code and modification)

        if not is_text_only_modification:
            t1 = time.time()
            logger.info(f"[AGENT 1/2] Analyzing sketch ({len(image_base64)} chars) via {BACKEND}...")
            try:
                analysis_msgs = build_analysis_messages(image_base64)
                raw_analysis = _call_ai_with_prompt(
                    analysis_msgs,
                    ANALYZE_SKETCH_SYSTEM_PROMPT,
                    max_tokens=600,   # Analysis is short — save tokens + latency
                )
                sketch_analysis = _parse_analysis(raw_analysis)
                t1_elapsed = time.time() - t1
                if sketch_analysis:
                    logger.info(
                        f"[AGENT 1/2] Analysis done in {t1_elapsed:.2f}s: "
                        f"layout={sketch_analysis.get('layout')}, "
                        f"elements={sketch_analysis.get('element_count')}, "
                        f"complexity={sketch_analysis.get('complexity')}"
                    )
                else:
                    logger.warning(f"[AGENT 1/2] Analysis failed in {t1_elapsed:.2f}s — falling back to single-call")
            except Exception as e:
                logger.warning(f"[AGENT 1/2] Analysis call error: {e} — falling back to single-call")
                sketch_analysis = None
        else:
            logger.info(f"[AGENT 1/2] Skipping analysis (text-only modification)")

        # ── AGENT STEP 2: Generate code (with auto-retry) ─────────────────────
        result = None
        last_error = None
        MAX_ATTEMPTS = 3

        for attempt in range(1, MAX_ATTEMPTS + 1):
            t2 = time.time()
            logger.info(
                f"[AGENT 2/2] Generating code attempt {attempt}/{MAX_ATTEMPTS} "
                f"(style={style}, purpose={purpose}, analysis={'✓' if sketch_analysis else '✗'})..."
            )

            messages = build_messages(
                image_base64, previous_code, modification,
                style, purpose, sketch_analysis=sketch_analysis,
            )

            raw_text = _call_ai_with_prompt(messages, system_prompt)
            t2_elapsed = time.time() - t2

            candidate = _parse_response(raw_text)
            component = candidate.get("component", "")

            # Validate: must have a real component (not empty / too short)
            is_valid = (
                "export default" in component
                and len(component) > 300
                and "function App" in component
            )

            if is_valid:
                result = candidate
                logger.info(
                    f"[AGENT 2/2] Code generated in {t2_elapsed:.2f}s "
                    f"({len(component)} chars) ✅"
                )
                break
            else:
                last_error = (
                    f"Output too short ({len(component)} chars) or missing export default"
                )
                logger.warning(
                    f"[AGENT 2/2] Attempt {attempt} invalid: {last_error}"
                    + (" — retrying..." if attempt < MAX_ATTEMPTS else " — using anyway")
                )
                # On retry: disable sketch_analysis to avoid repeating same mistake
                # (analysis might have been wrong — let the model re-analyze freely)
                if attempt == 2:
                    sketch_analysis = None
                    logger.info("[AGENT 2/2] Disabled analysis for final retry")

        # Use last candidate even if invalid (better than nothing)
        if result is None:
            result = _parse_response(raw_text)

        total_elapsed = time.time() - total_start
        logger.info(f"[AGENT DONE] Total pipeline time: {total_elapsed:.2f}s")

        result["latency_seconds"] = round(total_elapsed, 2)
        result["sketch_analysis"] = sketch_analysis  # Pass back to FE (future: display in UI)
        result["attempts"] = attempt
        return jsonify(result)

    except Exception as e:
        logger.error(f"[AGENT ERROR] {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/styles", methods=["GET"])
def get_styles():
    """Return available style presets."""
    styles = {k: {"name": v["name"]} for k, v in STYLE_PRESETS.items()}
    return jsonify(styles)


@app.route("/api/purposes", methods=["GET"])
def get_purposes():
    """Return available purpose intents."""
    purposes = {k: {"name": v["name"], "emoji": v["emoji"]} for k, v in PURPOSE_INTENTS.items()}
    return jsonify(purposes)


@app.route("/api/generate-stream", methods=["POST"])
def generate_stream():
    """Streaming generation — returns chunks as SSE."""
    body = request.json
    image_base64 = body.get("image_base64")

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    def stream():
        messages = build_messages(image_base64)
        if BACKEND == "openai":
            oai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in messages:
                content = msg["content"]
                if isinstance(content, str):
                    oai_messages.append({"role": msg["role"], "content": content})
                elif isinstance(content, list):
                    parts = []
                    for block in content:
                        if block.get("type") == "text":
                            parts.append({"type": "text", "text": block["text"]})
                        elif block.get("type") == "image":
                            b64 = block["source"]["data"]
                            media = block["source"]["media_type"]
                            parts.append({"type": "image_url", "image_url": {"url": f"data:{media};base64,{b64}"}})
                    oai_messages.append({"role": msg["role"], "content": parts})
            response = client.chat.completions.create(
                model=MODEL_ID, messages=oai_messages, max_tokens=MAX_TOKENS, temperature=0.3, stream=True,
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        elif BACKEND == "anthropic":
            with client.messages.stream(
                model=MODEL_ID, system=SYSTEM_PROMPT, messages=messages,
                max_tokens=MAX_TOKENS, temperature=0.3,
            ) as s:
                for text in s.text_stream:
                    yield text
        else:
            response = client.invoke_model_with_response_stream(
                modelId=MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                    "max_tokens": MAX_TOKENS,
                    "temperature": 0.3,
                }),
            )
            for event in response["body"]:
                chunk = json.loads(event["chunk"]["bytes"])
                if chunk["type"] == "content_block_delta":
                    text = chunk["delta"].get("text", "")
                    if text:
                        yield text

    return Response(stream(), mimetype="text/plain")


def _parse_response(raw_text: str) -> dict:
    """Parse Claude's JSON response, handling markdown wrapping."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        parsed = json.loads(text)
        return {
            "component": parsed.get("component", text),
            "description": parsed.get("description", "Generated component"),
        }
    except json.JSONDecodeError:
        return {
            "component": text,
            "description": "Generated component (raw)",
        }


if __name__ == "__main__":
    backend_name = {"openai": "OpenAI API", "anthropic": "Anthropic API", "bedrock": "AWS Bedrock"}[BACKEND]
    print(f"\n  🎨 Sketch → Living App — Dev Server ({backend_name})")
    print("  ──────────────────────────────────")
    print("  Local:  http://localhost:4000")
    print(f"  Model:  {MODEL_ID}")
    print("  Mock:   POST /api/mock-generate  (no API key needed)")
    print("  Live:   POST /api/generate\n")
    app.run(host="0.0.0.0", port=4000, debug=True)
