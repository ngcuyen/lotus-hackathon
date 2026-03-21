# Sketch2App Backend API Documentation

## Base URL

- **Production**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod`
- **Local Development**: `http://localhost:4000` (via SAM local)

---

## Authentication

Currently, the API uses a simple `userId` parameter (defaults to `"default"`). In production, this should be replaced with proper authentication (JWT, Cognito, etc.).

---

## API Endpoints

### 1. Generate App from Sketch

Generate React code from a sketch image using Claude Vision.

**Endpoint**: `POST /api/generate`

**Request Body**:
```json
{
  "image_base64": "data:image/png;base64,...",
  "previous_code": "...",  // Optional: for iterative refinement
  "modification": "make it blue",  // Optional: text instruction
  "style": "modern",  // Optional: style preset
  "purpose": "login form"  // Optional: app purpose
}
```

**Response**:
```json
{
  "component": "import { useState } from 'react'...",
  "description": "Login form with email and password inputs",
  "latency_seconds": 3.42
}
```

---

### 2. Custom Styles Management

#### 2.1 Save Custom Style

**Endpoint**: `POST /api/styles`

**Request Body**:
```json
{
  "userId": "default",  // Optional
  "style": {
    "id": "custom-1234567890",
    "name": "My Gradient Style",
    "description": "Beautiful gradient design with rounded corners",
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
```

**Response**:
```json
{
  "success": true,
  "styleId": "custom-1234567890",
  "message": "Style saved successfully"
}
```

---

#### 2.2 List Custom Styles

**Endpoint**: `GET /api/styles?userId=default`

**Response**:
```json
{
  "styles": [
    {
      "id": "custom-1234567890",
      "name": "My Gradient Style",
      "description": "Beautiful gradient design with rounded corners",
      "data": {
        "colorPrimary": "#FF6B6B",
        "colorSecondary": "#4ECDC4",
        "fontFamily": "Inter",
        "borderRadius": "12px",
        "spacing": "normal",
        "shadows": true
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### 2.3 Delete Custom Style

**Endpoint**: `DELETE /api/styles/{styleId}?userId=default`

**Response**:
```json
{
  "success": true,
  "message": "Style deleted successfully"
}
```

---

### 3. Panel Settings Management

#### 3.1 Save Panel Settings

**Endpoint**: `POST /api/settings/panel`

**Request Body**:
```json
{
  "userId": "default",  // Optional
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
```

**Response**:
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

---

#### 3.2 Get Panel Settings

**Endpoint**: `GET /api/settings/panel?userId=default`

**Response**:
```json
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
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "isDefault": false
}
```

If no settings exist, returns default settings with `isDefault: true`.

---

#### 3.3 Reset Panel Settings

**Endpoint**: `POST /api/settings/panel/reset?userId=default`

**Response**:
```json
{
  "success": true,
  "settings": {
    "panelOpacity": 75,
    "panelBlur": 12,
    "borderGlow": true,
    "animationSpeed": "normal",
    "colorScheme": "cyan",
    "fontSize": "medium",
    "spacing": "normal"
  },
  "message": "Settings reset to defaults"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Frontend Integration

Use the provided TypeScript API clients:

```typescript
// Custom Styles
import { saveCustomStyle, listCustomStyles, deleteCustomStyle } from './api/styles';

// Save a custom style
const style = {
  id: `custom-${Date.now()}`,
  name: "My Style",
  description: "Description",
  data: { colorPrimary: "#FF6B6B" }
};
await saveCustomStyle(style);

// List all styles
const { styles } = await listCustomStyles();

// Delete a style
await deleteCustomStyle("custom-1234567890");
```

```typescript
// Panel Settings
import { getPanelSettings, savePanelSettings, resetPanelSettings } from './api/settings';

// Get current settings
const { settings } = await getPanelSettings();

// Save new settings
await savePanelSettings({
  panelOpacity: 80,
  panelBlur: 16,
  borderGlow: true,
  animationSpeed: "fast",
  colorScheme: "purple",
  fontSize: "large",
  spacing: "spacious"
});

// Reset to defaults
await resetPanelSettings();
```

---

## Deployment

### Deploy Backend

```bash
cd backend
sam build
sam deploy --guided  # First time
sam deploy           # Subsequent deploys
```

### Environment Variables

Set in `template.yaml` or via AWS Console:

- `S3_BUCKET` - S3 bucket name for storage (auto-set by CloudFormation)
- `MODEL_ID` - Claude model ID (default: `us.anthropic.claude-sonnet-4-20250514-v1:0`)
- `AWS_REGION` - AWS region (default: `us-east-1`)

### Frontend Configuration

Set in `.env`:

```bash
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

---

## Storage Structure in S3

```
s3://sketch2app-images-{account-id}/
├── sketches/
│   └── {request-id}.png          # Uploaded sketch images
├── users/
│   └── {userId}/
│       ├── styles/
│       │   ├── custom-123.json   # Custom style definitions
│       │   └── custom-456.json
│       └── panel-settings.json   # Panel customization settings
```

---

## Notes

- All custom styles and settings are stored in S3 as JSON files
- S3 lifecycle policy deletes sketch images after 7 days
- Custom styles and settings persist indefinitely (manual cleanup required)
- For production, implement proper authentication and user management
- Consider adding rate limiting for API endpoints
