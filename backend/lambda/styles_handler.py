"""
Custom Styles Management Handler
Manages user-created design styles for Sketch2App.

API Endpoints:
- POST /api/styles - Save a new custom style
- GET /api/styles - List all custom styles for user
- DELETE /api/styles/{styleId} - Delete a custom style
"""

import json
import os
import logging
import boto3
from datetime import datetime
from typing import Dict, List

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
s3 = boto3.client("s3")
BUCKET = os.environ.get("S3_BUCKET", "sketch2app-images")


def save_style(event, context):
    """
    Save a new custom style.

    Expected body:
    {
        "userId": "default",  # Optional, defaults to "default"
        "style": {
            "id": "custom-1234567890",
            "name": "My Custom Style",
            "description": "Beautiful gradient design",
            "data": {
                "colorPrimary": "#FF6B6B",
                "colorSecondary": "#4ECDC4",
                "fontFamily": "Inter",
                "borderRadius": "12px",
                "spacing": "normal",
                "shadows": true
            }
        }
    }

    Returns:
    {
        "success": true,
        "styleId": "custom-1234567890",
        "message": "Style saved successfully"
    }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("userId", "default")
        style = body.get("style")

        if not style or not style.get("id"):
            return _response(400, {"error": "style and style.id are required"})

        style_id = style["id"]

        # Add metadata
        style["createdAt"] = datetime.utcnow().isoformat()
        style["updatedAt"] = datetime.utcnow().isoformat()

        # Save to S3
        key = f"users/{user_id}/styles/{style_id}.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=json.dumps(style, indent=2),
            ContentType="application/json",
            Metadata={
                "userId": user_id,
                "styleId": style_id,
                "styleName": style.get("name", "Untitled")
            }
        )

        logger.info(f"Saved style {style_id} for user {user_id}")

        return _response(200, {
            "success": True,
            "styleId": style_id,
            "message": "Style saved successfully"
        })

    except Exception as e:
        logger.error(f"Error saving style: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def list_styles(event, context):
    """
    List all custom styles for a user.

    Query params:
    - userId: default (optional)

    Returns:
    {
        "styles": [
            {
                "id": "custom-1234567890",
                "name": "My Custom Style",
                "description": "Beautiful gradient design",
                "data": {...},
                "createdAt": "2025-01-15T10:30:00Z",
                "updatedAt": "2025-01-15T10:30:00Z"
            }
        ]
    }
    """
    try:
        params = event.get("queryStringParameters") or {}
        user_id = params.get("userId", "default")

        # List all styles for this user
        prefix = f"users/{user_id}/styles/"

        try:
            response = s3.list_objects_v2(
                Bucket=BUCKET,
                Prefix=prefix
            )
        except s3.exceptions.NoSuchBucket:
            logger.warning(f"Bucket {BUCKET} does not exist")
            return _response(200, {"styles": []})

        styles = []

        if "Contents" in response:
            for obj in response["Contents"]:
                try:
                    # Get the style object
                    style_obj = s3.get_object(Bucket=BUCKET, Key=obj["Key"])
                    style_data = json.loads(style_obj["Body"].read())
                    styles.append(style_data)
                except Exception as e:
                    logger.warning(f"Failed to read style {obj['Key']}: {e}")
                    continue

        # Sort by createdAt descending (newest first)
        styles.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        return _response(200, {"styles": styles})

    except Exception as e:
        logger.error(f"Error listing styles: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def delete_style(event, context):
    """
    Delete a custom style.

    Path params:
    - styleId: The ID of the style to delete

    Query params:
    - userId: default (optional)

    Returns:
    {
        "success": true,
        "message": "Style deleted successfully"
    }
    """
    try:
        # Get styleId from path parameters
        path_params = event.get("pathParameters") or {}
        style_id = path_params.get("styleId")

        if not style_id:
            return _response(400, {"error": "styleId is required"})

        query_params = event.get("queryStringParameters") or {}
        user_id = query_params.get("userId", "default")

        # Delete from S3
        key = f"users/{user_id}/styles/{style_id}.json"

        try:
            s3.delete_object(Bucket=BUCKET, Key=key)
            logger.info(f"Deleted style {style_id} for user {user_id}")

            return _response(200, {
                "success": True,
                "message": "Style deleted successfully"
            })
        except Exception as e:
            logger.warning(f"Failed to delete style {key}: {e}")
            return _response(404, {"error": "Style not found"})

    except Exception as e:
        logger.error(f"Error deleting style: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def _response(status_code: int, body: Dict) -> Dict:
    """Format Lambda proxy response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        },
        "body": json.dumps(body),
    }
