"""
Sketch → Living App — Lambda Handler
Receives a sketch image, calls Bedrock Claude Vision, returns React code.

Deploy: AWS SAM / CDK / Serverless Framework
Runtime: Python 3.12
Memory: 512MB (image processing needs headroom)
Timeout: 30s (Claude Vision can take 3-8s)
"""

import json
import os
import time
import logging
import boto3
from prompts import SYSTEM_PROMPT, build_messages

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── AWS Clients ───
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
)

s3 = boto3.client("s3")
BUCKET = os.environ.get("S3_BUCKET", "sketch2app-images")

# ─── Model Config ───
# Use Claude Sonnet 4 for best speed/quality balance
MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
MAX_TOKENS = 4096


def handler(event, context):
    """
    Main Lambda handler.
    
    Expected body:
    {
        "image_base64": "...",           # Required: base64 encoded sketch image
        "previous_code": "...",          # Optional: for iterative refinement
        "modification": "make it blue"   # Optional: text instruction for changes
    }
    """
    try:
        # Parse request
        body = json.loads(event.get("body", "{}"))
        image_base64 = body.get("image_base64")
        previous_code = body.get("previous_code")
        modification = body.get("modification")

        if not image_base64:
            return _response(400, {"error": "image_base64 is required"})

        # Optionally store image in S3 for debugging/history
        _store_image(image_base64, context.aws_request_id)

        # ─── Call Bedrock Claude Vision ───
        start_time = time.time()

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
                "temperature": 0.3,  # Lower temp = more consistent code output
            }),
        )

        ai_latency = time.time() - start_time
        logger.info(f"Bedrock latency: {ai_latency:.2f}s")

        # Parse response
        response_body = json.loads(response["body"].read())
        raw_text = response_body["content"][0]["text"]

        # Parse the JSON from Claude's response
        result = _parse_claude_response(raw_text)
        result["latency_seconds"] = round(ai_latency, 2)

        return _response(200, result)

    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def handler_stream(event, context):
    """
    Streaming version — returns code token by token.
    Use with API Gateway WebSocket or Lambda response streaming.
    """
    try:
        body = json.loads(event.get("body", "{}"))
        image_base64 = body.get("image_base64")

        if not image_base64:
            return _response(400, {"error": "image_base64 is required"})

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

        # Collect streamed chunks
        full_text = ""
        for event_chunk in response["body"]:
            chunk = json.loads(event_chunk["chunk"]["bytes"])
            if chunk["type"] == "content_block_delta":
                delta = chunk["delta"].get("text", "")
                full_text += delta

        result = _parse_claude_response(full_text)
        return _response(200, result)

    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def _parse_claude_response(raw_text: str) -> dict:
    """
    Parse Claude's response. It should be JSON, but sometimes
    Claude wraps it in markdown backticks or adds extra text.
    """
    text = raw_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Try parsing as JSON
    try:
        parsed = json.loads(text)
        return {
            "component": parsed.get("component", text),
            "description": parsed.get("description", "Generated component"),
        }
    except json.JSONDecodeError:
        # If JSON parse fails, treat the whole response as code
        logger.warning("Failed to parse JSON from Claude, treating as raw code")
        return {
            "component": text,
            "description": "Generated component (raw output)",
        }


def _store_image(image_base64: str, request_id: str):
    """
    Store the sketch image in S3 for history/debugging.
    Non-blocking — failures here don't affect the main flow.
    """
    try:
        import base64

        image_bytes = base64.b64decode(image_base64)
        s3.put_object(
            Bucket=BUCKET,
            Key=f"sketches/{request_id}.png",
            Body=image_bytes,
            ContentType="image/png",
        )
    except Exception as e:
        logger.warning(f"Failed to store image: {e}")


def _response(status_code: int, body: dict) -> dict:
    """Format Lambda proxy response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        "body": json.dumps(body),
    }
