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
    STYLE_PRESETS, PURPOSE_INTENTS, BASE_PROMPT,
    ANALYZE_SKETCH_SYSTEM_PROMPT, build_analysis_messages,
    DESIGNER_SYSTEM_PROMPT, build_design_messages,
)

from db import save_generation, get_generation, list_generations, delete_generation

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TOKENS = 16384
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# ─── Choose backend: OpenAI / Anthropic API / Bedrock ───
if OPENAI_API_KEY:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    MODEL_ID = "gpt-5.4"
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


def _call_openai(messages, system_prompt=SYSTEM_PROMPT):
    """Call OpenAI API. Convert Anthropic message format to OpenAI format."""
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
        model=MODEL_ID, messages=oai_messages, max_completion_tokens=MAX_TOKENS, temperature=0.3,
    )
    return response.choices[0].message.content


def _call_anthropic(messages, system_prompt=SYSTEM_PROMPT):
    """Call Anthropic API directly."""
    response = client.messages.create(
        model=MODEL_ID, system=system_prompt, messages=messages,
        max_tokens=MAX_TOKENS, temperature=0.3,
    )
    return response.content[0].text


def _call_bedrock(messages, system_prompt=SYSTEM_PROMPT):
    """Call AWS Bedrock."""
    response = client.invoke_model(
        modelId=MODEL_ID, contentType="application/json", accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31", "system": system_prompt,
            "messages": messages, "max_tokens": MAX_TOKENS, "temperature": 0.3,
        }),
    )
    response_body = json.loads(response["body"].read())
    return response_body["content"][0]["text"]


def _call_ai(messages):
    return _call_ai_with_prompt(messages, SYSTEM_PROMPT)


def _call_ai_with_prompt(messages, system_prompt):
    if BACKEND == "openai":
        return _call_openai(messages, system_prompt)
    elif BACKEND == "anthropic":
        return _call_anthropic(messages, system_prompt)
    return _call_bedrock(messages, system_prompt)


def _parse_analysis(raw_text):
    """Parse sketch analysis JSON from Step 1. Returns None if invalid."""
    text = raw_text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    try:
        parsed = json.loads(text)
        # Validate required fields
        required = {"layout", "sections", "components", "inferred_purpose"}
        if required.issubset(parsed.keys()):
            return parsed
        logger.warning(f"Analysis missing fields: {required - parsed.keys()}")
        return None
    except json.JSONDecodeError as e:
        logger.warning(f"Analysis parse failed: {e}")
        return None


def _analyze_sketch(image_base64):
    """Step 1: Analyze sketch structure. Returns analysis dict or None on failure."""
    try:
        messages = build_analysis_messages(image_base64)
        raw = _call_ai_with_prompt(messages, ANALYZE_SKETCH_SYSTEM_PROMPT)
        analysis = _parse_analysis(raw)
        if analysis:
            logger.info(f"[ANALYZE] layout={analysis.get('layout')}, components={analysis.get('components')}")
        return analysis
    except Exception as e:
        logger.warning(f"[ANALYZE] Step 1 failed (continuing without analysis): {e}")
        return None


def _design_ui(sketch_analysis, style="modern", purpose=None):
    """Step 2: Generate design spec from analysis. Returns design dict or None."""
    try:
        messages = build_design_messages(sketch_analysis, style, purpose)
        raw = _call_ai_with_prompt(messages, DESIGNER_SYSTEM_PROMPT)
        spec = _parse_analysis(raw)  # Same JSON parse logic
        if spec:
            logger.info(f"[DESIGN] palette={spec.get('color_palette', {}).get('primary', '?')}, effects={len(spec.get('special_effects', []))}")
        return spec
    except Exception as e:
        logger.warning(f"[DESIGN] Step 2 failed (continuing without design): {e}")
        return None


@app.route("/api/generate", methods=["POST"])
def generate():
    """2-step generation: analyze sketch → generate code."""
    body = request.json
    image_base64 = body.get("image_base64")
    previous_code = body.get("previous_code")
    modification = body.get("modification")
    style = body.get("style", "modern")
    purpose = body.get("purpose")
    custom_guidelines = body.get("custom_guidelines")

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    try:
        start = time.time()
        logger.info(f"[1/5] Received image ({len(image_base64)} chars), style={style}, purpose={purpose}, custom={'yes' if custom_guidelines else 'no'}")

        # ── Step 1: Analyze sketch (skip for modifications — we already have context) ──
        sketch_analysis = None
        if not modification:
            t1 = time.time()
            sketch_analysis = _analyze_sketch(image_base64)
            logger.info(f"[2/5] Analysis done in {time.time() - t1:.2f}s — {'success' if sketch_analysis else 'skipped'}")
        else:
            logger.info("[2/5] Modification request — skipping analysis")

        # ── Step 2: Generate code ──
        if custom_guidelines:
            # Build prompt with custom guidelines injected
            logger.info(f"[2.5/5] Custom guidelines: {custom_guidelines[:100]}...")
            system_prompt = BASE_PROMPT.replace("{style_guidelines}", f"DESIGN STYLE — Custom:\n{custom_guidelines}")
            if purpose and purpose in PURPOSE_INTENTS:
                system_prompt += f"\n\nPURPOSE CONTEXT: The user intends this to be {PURPOSE_INTENTS[purpose]}. Tailor your output accordingly."
        else:
            system_prompt = get_system_prompt(style, purpose)
        messages = build_messages(
            image_base64, previous_code, modification,
            style, purpose, sketch_analysis
        )
        logger.info(f"[3/5] Built messages ({len(messages)} turns), calling {BACKEND}...")
        raw_text = _call_ai_with_prompt(messages, system_prompt)
        elapsed = time.time() - start
        logger.info(f"[4/5] AI responded in {elapsed:.2f}s ({len(raw_text)} chars)")

        result = _parse_response(raw_text)
        if sketch_analysis:
            result["sketch_analysis"] = sketch_analysis
        logger.info(f"[5/5] Done — description: {result.get('description', 'N/A')}")
        result["latency_seconds"] = round(elapsed, 2)

        # ── Save to DynamoDB ──
        try:
            saved = save_generation(
                style=style,
                purpose=purpose,
                component=result["component"],
                description=result.get("description", ""),
                latency_seconds=elapsed,
                sketch_analysis=sketch_analysis,
                parent_gen_id=body.get("parent_gen_id"),
                modification=modification,
                session_id=body.get("session_id"),
            )
            result["gen_id"] = saved["gen_id"]
            logger.info(f"[DB] Saved as {saved['gen_id']}")
        except Exception as db_err:
            logger.warning(f"[DB] Save failed (non-blocking): {db_err}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/styles", methods=["GET"])
def get_styles():
    """Return available style presets."""
    styles = {k: {"name": v["name"]} for k, v in STYLE_PRESETS.items()}
    return jsonify(styles)


@app.route("/api/purposes", methods=["GET"])
def get_purposes():
    """Return available purpose intents."""
    return jsonify(PURPOSE_INTENTS)


@app.route("/api/generate-stream", methods=["POST"])
def generate_stream():
    """3-step streaming generation: analyze → design → generate (SSE)."""
    body = request.json
    image_base64 = body.get("image_base64")
    style = body.get("style", "modern")
    purpose = body.get("purpose")
    previous_code = body.get("previous_code")
    modification = body.get("modification")

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    def stream():
        sketch_analysis = None
        design_spec = None

        # ── Step 1: Analyze sketch (skip for modifications) ──
        if not modification:
            yield "data: {\"status\": \"analyzing\"}\n\n"
            t1 = time.time()
            sketch_analysis = _analyze_sketch(image_base64)
            logger.info(f"[STREAM] Step 1 done in {time.time() - t1:.1f}s")

            # ── Step 2: Design UI ──
            if sketch_analysis:
                yield "data: {\"status\": \"designing\"}\n\n"
                t2 = time.time()
                design_spec = _design_ui(sketch_analysis, style, purpose)
                logger.info(f"[STREAM] Step 2 done in {time.time() - t2:.1f}s")

        # ── Step 3: Generate code (streaming) ──
        yield "data: {\"status\": \"generating\"}\n\n"
        system_prompt = get_system_prompt(style, purpose)
        messages = build_messages(
            image_base64, previous_code, modification,
            style, purpose, sketch_analysis, design_spec
        )

        if BACKEND == "openai":
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
                model=MODEL_ID, messages=oai_messages, max_completion_tokens=MAX_TOKENS, temperature=0.3, stream=True,
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        elif BACKEND == "anthropic":
            with client.messages.stream(
                model=MODEL_ID, system=system_prompt, messages=messages,
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
                    "system": system_prompt,
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

    return Response(stream(), mimetype="text/event-stream")


@app.route("/api/generations", methods=["GET"])
def api_list_generations():
    """List recent generations."""
    limit = request.args.get("limit", 50, type=int)
    session_id = request.args.get("session_id")
    items = list_generations(limit, session_id=session_id)
    return jsonify(items)


@app.route("/api/generations", methods=["POST"])
def api_save_generation():
    """Save a generation result from frontend (after streaming)."""
    body = request.json
    try:
        saved = save_generation(
            style=body.get("style"),
            purpose=body.get("purpose"),
            component=body.get("component", ""),
            description=body.get("description", ""),
            latency_seconds=body.get("latency_seconds", 0),
            session_id=body.get("session_id"),
            modification=body.get("modification"),
            parent_gen_id=body.get("parent_gen_id"),
            version=body.get("version"),
        )
        return jsonify(saved)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generations/<gen_id>", methods=["GET"])
def api_get_generation(gen_id):
    """Get a single generation with full component code."""
    item = get_generation(gen_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)


@app.route("/api/generations/<gen_id>", methods=["DELETE"])
def api_delete_generation(gen_id):
    """Delete a generation."""
    if delete_generation(gen_id):
        return jsonify({"ok": True})
    return jsonify({"error": "Delete failed"}), 500


@app.route("/api/mock-generate", methods=["POST"])
def mock_generate():
    """Mock endpoint — returns a hardcoded login form. No API key needed."""
    time.sleep(2)
    return jsonify({
        "component": '''import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <button className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-all">Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}''',
        "description": "Login page with email/password form",
        "latency_seconds": 2.0,
    })


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


# ─── Panel Settings (local JSON file storage for dev) ───

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), ".panel_settings.json")


def _load_settings():
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _save_settings(data):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)


DEFAULT_PANEL_SETTINGS = {
    "panelOpacity": 75,
    "panelBlur": 12,
    "borderGlow": True,
    "animationSpeed": "normal",
    "colorScheme": "cyan",
    "fontSize": "medium",
    "spacing": "normal",
}


@app.route("/api/settings/panel", methods=["GET"])
def get_panel_settings():
    data = _load_settings()
    if data:
        return jsonify(data)
    return jsonify({"settings": DEFAULT_PANEL_SETTINGS, "updatedAt": None, "isDefault": True})


@app.route("/api/settings/panel", methods=["POST"])
def save_panel_settings():
    body = request.json
    settings = body.get("settings")
    if not settings:
        return jsonify({"error": "settings are required"}), 400
    from datetime import datetime
    data = {"settings": settings, "updatedAt": datetime.utcnow().isoformat(), "userId": body.get("userId", "default")}
    _save_settings(data)
    return jsonify({"success": True, "message": "Settings saved successfully"})


@app.route("/api/settings/panel/reset", methods=["POST"])
def reset_panel_settings():
    try:
        os.remove(SETTINGS_FILE)
    except FileNotFoundError:
        pass
    return jsonify({"success": True, "settings": DEFAULT_PANEL_SETTINGS, "message": "Settings reset to defaults"})


if __name__ == "__main__":
    backend_name = {"openai": "OpenAI API", "anthropic": "Anthropic API", "bedrock": "AWS Bedrock"}[BACKEND]
    print(f"\n  🎨 Sketch → Living App — Dev Server ({backend_name})")
    print("  ──────────────────────────────────")
    print("  Local:  http://localhost:4000")
    print(f"  Model:  {MODEL_ID}")
    print("  Mock:   POST /api/mock-generate  (no API key needed)")
    print("  Live:   POST /api/generate\n")
    app.run(host="0.0.0.0", port=4000, debug=True)
