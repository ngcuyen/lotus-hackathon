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
from prompts import SYSTEM_PROMPT, build_messages

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TOKENS = 4096
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


def _call_openai(messages):
    """Call OpenAI API. Convert Anthropic message format to OpenAI format."""
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
        model=MODEL_ID, messages=oai_messages, max_tokens=MAX_TOKENS, temperature=0.3,
    )
    return response.choices[0].message.content


def _call_anthropic(messages):
    """Call Anthropic API directly."""
    response = client.messages.create(
        model=MODEL_ID, system=SYSTEM_PROMPT, messages=messages,
        max_tokens=MAX_TOKENS, temperature=0.3,
    )
    return response.content[0].text


def _call_bedrock(messages):
    """Call AWS Bedrock."""
    response = client.invoke_model(
        modelId=MODEL_ID, contentType="application/json", accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31", "system": SYSTEM_PROMPT,
            "messages": messages, "max_tokens": MAX_TOKENS, "temperature": 0.3,
        }),
    )
    response_body = json.loads(response["body"].read())
    return response_body["content"][0]["text"]


def _call_ai(messages):
    if BACKEND == "openai":
        return _call_openai(messages)
    elif BACKEND == "anthropic":
        return _call_anthropic(messages)
    return _call_bedrock(messages)


@app.route("/api/generate", methods=["POST"])
def generate():
    """Sync generation endpoint."""
    body = request.json
    image_base64 = body.get("image_base64")
    previous_code = body.get("previous_code")
    modification = body.get("modification")

    if not image_base64:
        return jsonify({"error": "image_base64 is required"}), 400

    try:
        start = time.time()
        logger.info(f"[1/4] Received image ({len(image_base64)} chars base64)")
        messages = build_messages(image_base64, previous_code, modification)
        logger.info(f"[2/4] Built messages ({len(messages)} messages), calling {BACKEND}...")
        raw_text = _call_ai(messages)
        elapsed = time.time() - start
        logger.info(f"[3/4] AI responded in {elapsed:.2f}s ({len(raw_text)} chars)")
        result = _parse_response(raw_text)
        logger.info(f"[4/4] Parsed response — description: {result.get('description', 'N/A')}")
        logger.info(f"[4/4] Component preview: {result.get('component', '')[:200]}...")
        result["latency_seconds"] = round(elapsed, 2)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


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


if __name__ == "__main__":
    backend_name = {"openai": "OpenAI API", "anthropic": "Anthropic API", "bedrock": "AWS Bedrock"}[BACKEND]
    print(f"\n  🎨 Sketch → Living App — Dev Server ({backend_name})")
    print("  ──────────────────────────────────")
    print("  Local:  http://localhost:4000")
    print(f"  Model:  {MODEL_ID}")
    print("  Mock:   POST /api/mock-generate  (no API key needed)")
    print("  Live:   POST /api/generate\n")
    app.run(host="0.0.0.0", port=4000, debug=True)
