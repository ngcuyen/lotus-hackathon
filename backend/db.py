"""
DynamoDB operations for sketch2app generations.
Table: sketch2app-generations (PK: gen_id)
"""

import os
import uuid
import logging
from decimal import Decimal
from datetime import datetime, timezone

import boto3

logger = logging.getLogger(__name__)

TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "sketch2app-generations")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

_table = None


def _get_table():
    global _table
    if _table is None:
        dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _table = dynamodb.Table(TABLE_NAME)
    return _table


def save_generation(
    style,
    purpose,
    component,
    description,
    latency_seconds,
    sketch_analysis=None,
    parent_gen_id=None,
    modification=None,
    session_id=None,
    version=None,
):
    """Save a generation result. Returns the saved item."""
    gen_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "gen_id": gen_id,
        "created_at": now,
        "style": style or "modern",
        "component": component,
        "description": description,
        "latency_seconds": Decimal(str(round(latency_seconds, 2))),
    }

    if purpose:
        item["purpose"] = purpose
    if sketch_analysis:
        item["sketch_analysis"] = sketch_analysis
    if parent_gen_id:
        item["parent_gen_id"] = parent_gen_id
    if modification:
        item["modification"] = modification
    if session_id:
        item["session_id"] = session_id
    if version:
        item["version"] = version

    try:
        _get_table().put_item(Item=item)
        logger.info(f"[DB] Saved generation {gen_id}")
        return item
    except Exception as e:
        logger.error(f"[DB] Failed to save: {e}")
        raise


def get_generation(gen_id):
    """Get a single generation by ID."""
    try:
        resp = _get_table().get_item(Key={"gen_id": gen_id})
        return resp.get("Item")
    except Exception as e:
        logger.error(f"[DB] Failed to get {gen_id}: {e}")
        return None


def list_generations(limit=50, session_id=None):
    """List recent generations, optionally filtered by session_id."""
    try:
        scan_kwargs = {
            "ProjectionExpression": "gen_id, created_at, #s, purpose, description, latency_seconds, modification, session_id, version",
            "ExpressionAttributeNames": {"#s": "style"},
        }
        if session_id:
            scan_kwargs["FilterExpression"] = "session_id = :sid"
            scan_kwargs["ExpressionAttributeValues"] = {":sid": session_id}
        resp = _get_table().scan(**scan_kwargs)
        items = resp.get("Items", [])
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items[:limit]
    except Exception as e:
        logger.error(f"[DB] Failed to list: {e}")
        return []


def delete_generation(gen_id):
    """Delete a generation by ID."""
    try:
        _get_table().delete_item(Key={"gen_id": gen_id})
        logger.info(f"[DB] Deleted {gen_id}")
        return True
    except Exception as e:
        logger.error(f"[DB] Failed to delete {gen_id}: {e}")
        return False
