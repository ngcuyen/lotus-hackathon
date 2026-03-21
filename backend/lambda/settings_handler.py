"""
Panel Settings Management Handler
Manages UI customization settings for Sketch2App panels.

API Endpoints:
- POST /api/settings/panel - Save panel settings
- GET /api/settings/panel - Get panel settings
"""

import json
import os
import logging
import boto3
from datetime import datetime
from typing import Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
s3 = boto3.client("s3")
BUCKET = os.environ.get("S3_BUCKET", "sketch2app-images")

# Default panel settings
DEFAULT_SETTINGS = {
    "panelOpacity": 75,
    "panelBlur": 12,
    "borderGlow": True,
    "animationSpeed": "normal",
    "colorScheme": "cyan",
    "fontSize": "medium",
    "spacing": "normal"
}


def save_panel_settings(event, context):
    """
    Save panel customization settings.

    Expected body:
    {
        "userId": "default",  # Optional, defaults to "default"
        "settings": {
            "panelOpacity": 75,
            "panelBlur": 12,
            "borderGlow": true,
            "animationSpeed": "normal",
            "colorScheme": "cyan",
            "fontSize": "medium",
            "spacing": "normal"
        }
    }

    Returns:
    {
        "success": true,
        "message": "Settings saved successfully"
    }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("userId", "default")
        settings = body.get("settings")

        if not settings:
            return _response(400, {"error": "settings are required"})

        # Validate settings structure
        valid_keys = {
            "panelOpacity", "panelBlur", "borderGlow",
            "animationSpeed", "colorScheme", "fontSize", "spacing"
        }

        for key in settings.keys():
            if key not in valid_keys:
                return _response(400, {
                    "error": f"Invalid setting key: {key}",
                    "validKeys": list(valid_keys)
                })

        # Add metadata
        settings_data = {
            "settings": settings,
            "updatedAt": datetime.utcnow().isoformat(),
            "userId": user_id
        }

        # Save to S3
        key = f"users/{user_id}/panel-settings.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=json.dumps(settings_data, indent=2),
            ContentType="application/json",
            Metadata={
                "userId": user_id,
                "settingsType": "panel"
            }
        )

        logger.info(f"Saved panel settings for user {user_id}")

        return _response(200, {
            "success": True,
            "message": "Settings saved successfully"
        })

    except Exception as e:
        logger.error(f"Error saving settings: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def get_panel_settings(event, context):
    """
    Get panel customization settings for a user.

    Query params:
    - userId: default (optional)

    Returns:
    {
        "settings": {
            "panelOpacity": 75,
            "panelBlur": 12,
            "borderGlow": true,
            "animationSpeed": "normal",
            "colorScheme": "cyan",
            "fontSize": "medium",
            "spacing": "normal"
        },
        "updatedAt": "2025-01-15T10:30:00Z"
    }
    """
    try:
        params = event.get("queryStringParameters") or {}
        user_id = params.get("userId", "default")

        # Get settings from S3
        key = f"users/{user_id}/panel-settings.json"

        try:
            response = s3.get_object(Bucket=BUCKET, Key=key)
            settings_data = json.loads(response["Body"].read())

            return _response(200, settings_data)

        except s3.exceptions.NoSuchKey:
            # Return default settings if none exist
            logger.info(f"No settings found for user {user_id}, returning defaults")
            return _response(200, {
                "settings": DEFAULT_SETTINGS,
                "updatedAt": None,
                "isDefault": True
            })

        except s3.exceptions.NoSuchBucket:
            logger.warning(f"Bucket {BUCKET} does not exist, returning defaults")
            return _response(200, {
                "settings": DEFAULT_SETTINGS,
                "updatedAt": None,
                "isDefault": True
            })

    except Exception as e:
        logger.error(f"Error getting settings: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def reset_panel_settings(event, context):
    """
    Reset panel settings to defaults.

    Query params:
    - userId: default (optional)

    Returns:
    {
        "success": true,
        "settings": {...},
        "message": "Settings reset to defaults"
    }
    """
    try:
        params = event.get("queryStringParameters") or {}
        user_id = params.get("userId", "default")

        # Delete existing settings
        key = f"users/{user_id}/panel-settings.json"

        try:
            s3.delete_object(Bucket=BUCKET, Key=key)
            logger.info(f"Reset panel settings for user {user_id}")
        except Exception as e:
            logger.warning(f"Failed to delete settings (may not exist): {e}")

        return _response(200, {
            "success": True,
            "settings": DEFAULT_SETTINGS,
            "message": "Settings reset to defaults"
        })

    except Exception as e:
        logger.error(f"Error resetting settings: {str(e)}", exc_info=True)
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
