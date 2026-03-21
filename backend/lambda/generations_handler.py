"""
Generations History Handler - CRUD operations for DynamoDB
"""

import json
import os
import logging
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "sketch2app-generations")
table = dynamodb.Table(TABLE_NAME)


def list_generations(event, context):
    """
    GET /api/generations?limit=50
    List all generations, sorted by created_at desc
    """
    try:
        # Parse query params
        params = event.get("queryStringParameters") or {}
        limit = int(params.get("limit", 50))

        # Scan table (for small dataset, scan is fine)
        # For production, use GSI with sort key on created_at
        response = table.scan(Limit=limit)

        items = response.get("Items", [])

        # Convert Decimal to float for JSON serialization
        items = _convert_decimals(items)

        # Sort by created_at desc
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        logger.info(f"Retrieved {len(items)} generations")
        return _response(200, items)

    except Exception as e:
        logger.error(f"List error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def get_generation(event, context):
    """
    GET /api/generations/{genId}
    Get a single generation by ID
    """
    try:
        gen_id = event.get("pathParameters", {}).get("genId")

        if not gen_id:
            return _response(400, {"error": "genId is required"})

        response = table.get_item(Key={"gen_id": gen_id})

        if "Item" not in response:
            return _response(404, {"error": "Generation not found"})

        item = _convert_decimals(response["Item"])
        return _response(200, item)

    except Exception as e:
        logger.error(f"Get error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def delete_generation(event, context):
    """
    DELETE /api/generations/{genId}
    Delete a generation by ID
    """
    try:
        gen_id = event.get("pathParameters", {}).get("genId")

        if not gen_id:
            return _response(400, {"error": "genId is required"})

        table.delete_item(Key={"gen_id": gen_id})

        logger.info(f"Deleted generation {gen_id}")
        return _response(200, {"message": "Deleted successfully"})

    except Exception as e:
        logger.error(f"Delete error: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def _convert_decimals(obj):
    """Convert DynamoDB Decimal types to float for JSON serialization"""
    if isinstance(obj, list):
        return [_convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj


def _response(status_code: int, body) -> dict:
    """Format Lambda proxy response with CORS headers"""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
        },
        "body": json.dumps(body),
    }
