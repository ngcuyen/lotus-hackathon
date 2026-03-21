"""
Local dev server for Sketch → Living App.
Runs on port 4000, proxied by Vite on port 3000.

This lets you test the full pipeline locally without deploying to AWS.
You still need AWS credentials configured (aws configure) with Bedrock access.

Usage:
    pip install flask flask-cors boto3
    python dev_server.py
"""

import json
import time
import base64
import logging
import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import boto3

# Add lambda dir to path so we can import prompts
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lambda"))
from prompts import SYSTEM_PROMPT, build_messages

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Bedrock Client ───
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))
MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
MAX_TOKENS = 4096


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

        messages = build_messages(image_base64, previous_code, modification)

        response = bedrock.invoke_model(
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

        elapsed = time.time() - start
        logger.info(f"Bedrock response in {elapsed:.2f}s")

        response_body = json.loads(response["body"].read())
        raw_text = response_body["content"][0]["text"]
        result = _parse_response(raw_text)
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
        response = bedrock.invoke_model_with_response_stream(
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
    """
    Mock endpoint — returns a hardcoded login form.
    Use this when you don't have AWS credentials or want to test UI quickly.
    """
    time.sleep(2)  # Simulate AI latency

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
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>

            <button className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all">
              Sign in
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Google
            </button>
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              GitHub
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <a href="#" className="text-blue-600 font-medium hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}''',
        "description": "Login page with email/password form, social auth, and sign-up link",
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
    print("\n  🎨 Sketch → Living App — Dev Server")
    print("  ──────────────────────────────────")
    print("  Local:  http://localhost:4000")
    print("  Mock:   POST /api/mock-generate  (no AWS needed)")
    print("  Live:   POST /api/generate       (needs AWS credentials)\n")
    app.run(host="0.0.0.0", port=4000, debug=True)
