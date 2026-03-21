"""
Sketch → Living App — Lambda Handler
Receives a sketch image, calls OpenAI GPT-4o Vision, returns React code.

Deploy: AWS SAM / CDK / Serverless Framework
Runtime: Python 3.12
Memory: 512MB (image processing needs headroom)
Timeout: 30s (GPT-4o Vision can take 3-8s)
"""

import json
import os
import time
import logging
import uuid
from datetime import datetime
import boto3
from openai import OpenAI
from prompts import SYSTEM_PROMPT, build_messages, get_system_prompt

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── OpenAI Client ───
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set - API calls will fail")

client = OpenAI(api_key=OPENAI_API_KEY)

# ─── AWS S3 Client ───
s3 = boto3.client("s3")
BUCKET = os.environ.get("S3_BUCKET", "sketch2app-images")

# ─── DynamoDB Client ───
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "sketch2app-generations")
table = dynamodb.Table(TABLE_NAME)

# ─── Model Config ───
MODEL_ID = os.environ.get("MODEL_ID", "gpt-4o")
MAX_TOKENS = 4096


def handler(event, context):
    """
    Main Lambda handler.

    Expected body:
    {
        "image_base64": "...",           # Required: base64 encoded sketch image
        "previous_code": "...",          # Optional: for iterative refinement
        "modification": "make it blue",  # Optional: text instruction for changes
        "style": "modern",               # Optional: style preset
        "purpose": "landing page"        # Optional: purpose intent
    }
    """
    try:
        # Parse request
        body = json.loads(event.get("body", "{}"))
        image_base64 = body.get("image_base64")
        previous_code = body.get("previous_code")
        modification = body.get("modification")
        style = body.get("style", "modern")
        purpose = body.get("purpose")

        if not image_base64:
            return _response(400, {"error": "image_base64 is required"})

        # Optionally store image in S3 for debugging/history
        _store_image(image_base64, context.aws_request_id)

        # ─── Call OpenAI GPT-4o Vision ───
        start_time = time.time()

        # Build messages in Anthropic format
        anthropic_messages = build_messages(
            image_base64, previous_code, modification,
            style, purpose, sketch_analysis=None
        )

        # Convert to OpenAI format
        system_prompt = get_system_prompt(style, purpose)
        openai_messages = _convert_to_openai_format(anthropic_messages, system_prompt)

        logger.info(f"Calling OpenAI {MODEL_ID} with {len(openai_messages)} messages")

        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=openai_messages,
            max_tokens=MAX_TOKENS,
            temperature=0.3,  # Lower temp = more consistent code output
        )

        ai_latency = time.time() - start_time
        logger.info(f"OpenAI latency: {ai_latency:.2f}s")

        # Parse response
        raw_text = response.choices[0].message.content

        # Parse the JSON from GPT's response
        result = _parse_ai_response(raw_text)
        result["latency_seconds"] = round(ai_latency, 2)

        # Save to DynamoDB
        gen_id = str(uuid.uuid4())
        _save_generation(
            gen_id=gen_id,
            description=result.get("description", ""),
            component=result.get("component", ""),
            style=style,
            purpose=purpose,
            modification=modification,
            latency_seconds=result["latency_seconds"],
        )

        result["gen_id"] = gen_id
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
        style = body.get("style", "modern")
        purpose = body.get("purpose")

        if not image_base64:
            return _response(400, {"error": "image_base64 is required"})

        # Build messages
        anthropic_messages = build_messages(image_base64)
        system_prompt = get_system_prompt(style, purpose)
        openai_messages = _convert_to_openai_format(anthropic_messages, system_prompt)

        # Stream response
        stream = client.chat.completions.create(
            model=MODEL_ID,
            messages=openai_messages,
            max_tokens=MAX_TOKENS,
            temperature=0.3,
            stream=True,
        )

        # Collect streamed chunks
        full_text = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                full_text += chunk.choices[0].delta.content

        result = _parse_ai_response(full_text)
        return _response(200, result)

    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def _convert_to_openai_format(anthropic_messages, system_prompt):
    """
    Convert Anthropic message format to OpenAI format.

    Anthropic format:
    [
        {
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}},
                {"type": "text", "text": "..."}
            ]
        }
    ]

    OpenAI format:
    [
        {"role": "system", "content": "..."},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "..."},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            ]
        }
    ]
    """
    openai_messages = [{"role": "system", "content": system_prompt}]

    for msg in anthropic_messages:
        content = msg["content"]

        if isinstance(content, str):
            # Simple text message
            openai_messages.append({"role": msg["role"], "content": content})
        elif isinstance(content, list):
            # Multi-part message (image + text)
            parts = []
            for block in content:
                if block.get("type") == "text":
                    parts.append({"type": "text", "text": block["text"]})
                elif block.get("type") == "image":
                    # Convert Anthropic image format to OpenAI format
                    b64_data = block["source"]["data"]
                    media_type = block["source"]["media_type"]
                    parts.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64_data}"}
                    })
            openai_messages.append({"role": msg["role"], "content": parts})

    return openai_messages


def _parse_ai_response(raw_text: str) -> dict:
    """
    Parse AI response. It should be JSON, but sometimes
    AI wraps it in markdown backticks or adds extra text.
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
        logger.warning("Failed to parse JSON from AI, treating as raw code")
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


def _save_generation(
    gen_id: str,
    description: str,
    component: str,
    style: str,
    purpose: str = None,
    modification: str = None,
    latency_seconds: float = 0,
):
    """
    Save generation to DynamoDB.
    Non-blocking — failures here don't affect the main flow.
    """
    try:
        item = {
            "gen_id": gen_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "description": description,
            "component": component,
            "style": style,
            "latency_seconds": latency_seconds,
        }

        if purpose:
            item["purpose"] = purpose
        if modification:
            item["modification"] = modification

        table.put_item(Item=item)
        logger.info(f"Saved generation {gen_id} to DynamoDB")

    except Exception as e:
        logger.warning(f"Failed to save generation: {e}")


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
