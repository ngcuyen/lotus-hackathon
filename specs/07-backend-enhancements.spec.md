# Backend Enhancement Suggestions

## 1. Visual Editor Support (P0 — REQUIRED FOR FRONTEND)

### Problem
Frontend has implemented Visual Editor UI that allows users to:
- Click elements in the preview to select them
- Drag elements to reposition them
- Modify element properties (color, size, text)
- Delete elements
- Apply custom modifications

**Backend MUST support incremental modifications** instead of regenerating the entire component from scratch. This is the core iteration loop feature.

### Current Frontend Implementation

Frontend sends modification requests with:
```typescript
{
  image_base64: string,        // Original sketch image
  previous_code: string,       // Current component code
  modification: string,        // Natural language instruction
  style?: string               // Selected style preset
}
```

**Example modification strings from frontend:**
1. **Color change**: `"Change the background color of this button to #00d4ff"`
2. **Size change**: `"Make this button larger"`
3. **Text change**: `"Change the text of this button to 'Click me'"`
4. **Delete**: `"Remove this button element"`
5. **Drag/Move**: `"Move the button 50px to the right and 30px down"`
6. **Custom**: Any freeform text like `"Add shadow and rounded corners"`

### Backend Requirements

#### 1.1 API Contract

**Endpoint**: `POST /api/generate` (same endpoint, enhanced)

**Request Body**:
```json
{
  "image_base64": "base64_encoded_image",
  "previous_code": "import { useState } from 'react'...",  // NEW: Optional
  "modification": "Change the Sign In button to green",    // NEW: Optional
  "style": "modern"
}
```

**Response** (unchanged):
```json
{
  "component": "import { useState } from 'react'...",
  "description": "Modified: Changed button color to green"
}
```

**Logic**:
- If `previous_code` is `null` or empty → **Initial generation** from sketch
- If `previous_code` exists + `modification` exists → **Incremental modification**
- If `previous_code` exists but no `modification` → Regenerate from sketch (iteration without changes)

#### 1.2 Prompt Engineering Strategy

**CRITICAL**: AI must ONLY modify the specified element, not refactor entire code.

##### Initial Generation Prompt (no previous_code)
```python
INITIAL_GENERATION_PROMPT = """
You are an expert React developer. Analyze this wireframe sketch and generate a production-ready React component.

Style: {style}

Requirements:
- Use React 18 with hooks (useState, useEffect, etc.)
- Use Tailwind CSS for styling
- Implement {style} design style
- Make it interactive and functional
- Include proper accessibility

Return ONLY valid React JSX code. Do not include explanations.
"""
```

##### Modification Prompt (with previous_code)
```python
MODIFICATION_PROMPT = """
You are an expert React developer. Modify ONLY the specified element in this component.

CURRENT CODE:
```jsx
{previous_code}
```

USER REQUEST:
{modification}

CRITICAL RULES:
1. ONLY modify the element mentioned in the request
2. Keep ALL other code unchanged (imports, state, handlers, other elements)
3. Maintain existing functionality
4. Keep the same component structure
5. Do not refactor or "improve" unrelated parts

Return the COMPLETE modified component code. Do not include explanations.
"""
```

**Key differences**:
- Modification prompt explicitly forbids refactoring
- Shows full previous code as context
- Emphasizes "ONLY modify specified element"

#### 1.3 Implementation Example (Python)

```python
def generate_component(request):
    image_base64 = request.get("image_base64")
    previous_code = request.get("previous_code")
    modification = request.get("modification")
    style = request.get("style", "modern")

    # Determine mode
    if previous_code and modification:
        # MODIFICATION MODE
        prompt = MODIFICATION_PROMPT.format(
            previous_code=previous_code,
            modification=modification
        )
        system_prompt = "You are a precise code editor. Make minimal changes."

    else:
        # INITIAL GENERATION MODE
        prompt = INITIAL_GENERATION_PROMPT.format(style=style)
        system_prompt = "You are an expert React developer."

    # Call Bedrock
    response = bedrock.invoke_model(
        modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
        body={
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.3,  # Lower temp for modifications (more consistent)
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_base64
                            }
                        } if not previous_code else None,  # Only include image for initial gen
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }
    )

    # Parse response
    component_code = extract_code(response)
    description = generate_description(modification or "Initial generation")

    return {
        "component": component_code,
        "description": description
    }
```

**Key implementation notes**:
- Use `temperature: 0.3` for modifications (more deterministic)
- Use `temperature: 0.5-0.7` for initial generation (more creative)
- Only include image in initial generation, not modifications
- System prompt changes based on mode

#### 1.4 Response Quality Checks

Before returning response, validate:

```python
def validate_modification(previous_code, new_code, modification):
    """Ensure modification was applied correctly"""

    checks = {
        "valid_jsx": is_valid_jsx(new_code),
        "has_export": "export default" in new_code or "function App" in new_code,
        "similar_structure": similarity_score(previous_code, new_code) > 0.7,  # Should be mostly same
        "no_missing_imports": check_imports(new_code)
    }

    if not all(checks.values()):
        # Retry with stronger prompt
        return retry_with_stronger_constraints(previous_code, modification)

    return new_code
```

**Quality gates**:
- Valid JSX syntax
- Export statement present
- Structural similarity > 70% (most code unchanged)
- All necessary imports present

#### 1.5 Error Handling

Common failure modes:

| Issue | Cause | Solution |
|-------|-------|----------|
| AI refactors entire code | Too creative prompt | Add "CRITICAL: NO REFACTORING" to prompt |
| Element not found | Vague modification text | Ask user to be more specific (future) |
| Code breaks after modification | Missing import/state | Validate + retry with error context |
| AI ignores previous_code | Model hallucination | Include line numbers in previous_code |

**Retry strategy**:
```python
def handle_modification_failure(previous_code, modification, error):
    """Fallback: Try again with more explicit constraints"""

    retry_prompt = f"""
PREVIOUS ATTEMPT FAILED: {error}

You MUST:
1. Start with this exact code: {previous_code}
2. Find the element mentioned: {modification}
3. Change ONLY that element's properties
4. Return the COMPLETE code with minimal changes

DO NOT:
- Remove any existing code
- Refactor unrelated parts
- Change component structure
- Add new features not requested
"""

    return invoke_bedrock(retry_prompt)
```

### 1.6 Testing Strategy

**Test cases for backend**:

```python
# Test 1: Initial generation
request = {
    "image_base64": "...",
    "style": "modern"
}
response = generate_component(request)
assert "export default" in response["component"]

# Test 2: Color modification
request = {
    "image_base64": "...",
    "previous_code": MOCK_LOGIN_FORM,
    "modification": "Change the Sign In button background to green",
    "style": "modern"
}
response = generate_component(request)
assert "green" in response["component"].lower()
assert "Sign In" in response["component"]  # Button still exists

# Test 3: Delete element
request = {
    "previous_code": MOCK_LOGIN_FORM,
    "modification": "Remove the forgot password link"
}
response = generate_component(request)
assert "forgot password" not in response["component"].lower()

# Test 4: Sequential modifications
code1 = generate_component({"image_base64": "..."})
code2 = generate_component({"previous_code": code1, "modification": "Make button larger"})
code3 = generate_component({"previous_code": code2, "modification": "Change text color to blue"})
# All 3 should be progressively similar, not completely different
```

### 1.7 Performance Optimization

**Prompt Caching** (Claude 3.5+ feature):
```python
# Cache the previous_code to save tokens
response = bedrock.invoke_model(
    body={
        "system": [
            {
                "type": "text",
                "text": "You are a precise code editor.",
                "cache_control": {"type": "ephemeral"}
            }
        ],
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"CURRENT CODE:\n{previous_code}",
                        "cache_control": {"type": "ephemeral"}  # Cache this
                    },
                    {
                        "type": "text",
                        "text": f"MODIFY: {modification}"
                    }
                ]
            }
        ]
    }
)
```

**Benefits**:
- ~90% cost reduction on repeated context
- ~40% latency reduction
- Essential for multiple sequential modifications

### 1.8 Acceptance Criteria

- [ ] Backend accepts `previous_code` + `modification` in request
- [ ] Modifications preserve >70% of original code structure
- [ ] Color changes work correctly (validated by substring search)
- [ ] Text changes work correctly
- [ ] Element deletion works
- [ ] 5 sequential modifications don't cause code degradation
- [ ] Response time < 8s for modifications
- [ ] Prompt caching reduces cost by >80% on repeated calls

### 1.9 Demo Preparation

**Pre-cached responses for demo reliability**:

Store in S3 or Lambda environment:
```json
{
  "demo_scenarios": [
    {
      "name": "login_form_color_change",
      "image": "base64...",
      "previous_code": "...",
      "modification": "Change button to green",
      "response": {
        "component": "...",
        "description": "Modified button color"
      }
    }
  ]
}
```

**Fallback logic**:
```python
# If Bedrock call fails during demo
if is_demo_mode and bedrock_failed:
    cached_response = DEMO_SCENARIOS.get(modification_hash)
    if cached_response:
        return cached_response
```

### Hackathon Priority
**P0 — CRITICAL** — Frontend depends on this. Without it, Visual Editor is useless.

**Estimated effort**: 4-6 hours
- Prompt engineering: 2h
- Request handling: 1h
- Testing: 1-2h
- Prompt caching: 1h

---

## 2. Database Strategy for Version History

### Problem
Visual Editor tạo ra nhiều versions khi user chỉnh sửa. Cần lưu trữ để:
- Undo/Redo giữa các versions
- Debug khi demo bị lỗi
- Show timeline UI
- Persistence giữa các sessions

**Question**: Nên dùng database gì? DynamoDB? RDS? S3? Hay không cần backend database?

### Recommendation for Hackathon: **NO DATABASE** (Frontend-only)

#### Why No Database for 24h Hackathon?

**Frontend handles version history with LocalStorage**:
```typescript
// Frontend manages versions locally
const versions = JSON.parse(localStorage.getItem('versions') || '[]');
localStorage.setItem('versions', JSON.stringify(versions));
```

**Backend stays STATELESS**:
- Backend chỉ xử lý AI generation
- Không lưu versions, không track sessions
- Simple Lambda function, no database connections
- Faster development, zero DB setup time

#### Rationale

| Factor | LocalStorage (Frontend) | DynamoDB (Backend) |
|--------|------------------------|-------------------|
| **Setup time** | 0 hours | 2-3 hours |
| **Dev complexity** | Low (frontend only) | High (backend + frontend) |
| **Demo reliability** | High (offline works) | Medium (network dependency) |
| **Cost** | $0 | $0 (free tier) |
| **Persistence** | Browser only | Cross-device |
| **Hackathon risk** | 🟢 Zero | 🟡 Medium |

**For 24h hackathon**: Time is more valuable than features. Skip database.

#### Frontend Implementation (No Backend Changes)

Frontend will implement `useVersionHistory` hook:
```typescript
interface Version {
  id: string;
  code: string;
  description: string;
  modification?: string;
  timestamp: number;
}

// Stored in localStorage: 'sketch2app_versions'
// Max 20 versions to avoid quota
// Auto-cleanup oldest versions
```

**Backend does NOTHING** — completely stateless.

---

## 2.1 Database Strategy for Post-Hackathon (Optional)

If you want to add database AFTER hackathon (production), here's the migration path:

### Phase 1: Keep LocalStorage as Fallback

Frontend keeps using LocalStorage, backend adds OPTIONAL sync:

```python
# New optional endpoint
POST /api/versions/sync
{
  "session_id": "uuid",
  "versions": [...]  # Upload from localStorage
}
```

### Phase 2: Add DynamoDB for Persistence

#### DynamoDB Table Schema

```yaml
# backend/template.yaml
Resources:
  VersionHistoryTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: sketch2app-versions
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: session_id
          AttributeType: S
        - AttributeName: version_id
          AttributeType: S
      KeySchema:
        - AttributeName: session_id
          KeyType: HASH
        - AttributeName: version_id
          KeyType: RANGE
      TimeToLiveSpecification:
        Enabled: true
        AttributeName: ttl
      GlobalSecondaryIndexes:
        - IndexName: timestamp-index
          Keys:
            - AttributeName: session_id
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
```

#### Backend Implementation

```python
import boto3
from datetime import datetime, timedelta
from typing import Dict, List

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('sketch2app-versions')

def save_version(session_id: str, version_data: Dict) -> str:
    """
    Save version to DynamoDB

    Args:
        session_id: Unique session identifier (UUID)
        version_data: {
            'component': str,
            'description': str,
            'modification': str (optional),
            'style': str
        }

    Returns:
        version_id: Created version ID
    """
    version_id = f"v{int(datetime.now().timestamp() * 1000)}"
    timestamp = datetime.now().isoformat()

    item = {
        'session_id': session_id,
        'version_id': version_id,
        'timestamp': timestamp,
        'component_code': version_data['component'],
        'description': version_data['description'],
        'modification_prompt': version_data.get('modification'),
        'style': version_data.get('style', 'modern'),
        'ttl': int((datetime.now() + timedelta(days=7)).timestamp())  # Auto-expire after 7 days
    }

    table.put_item(Item=item)
    return version_id

def get_versions(session_id: str, limit: int = 20) -> List[Dict]:
    """
    Get all versions for a session, sorted by timestamp

    Args:
        session_id: Session to query
        limit: Max versions to return (default 20)

    Returns:
        List of version objects
    """
    response = table.query(
        KeyConditionExpression='session_id = :sid',
        ExpressionAttributeValues={':sid': session_id},
        ScanIndexForward=False,  # Descending order (newest first)
        Limit=limit
    )

    return response['Items']

def get_version(session_id: str, version_id: str) -> Dict:
    """Get specific version"""
    response = table.get_item(
        Key={
            'session_id': session_id,
            'version_id': version_id
        }
    )

    if 'Item' not in response:
        raise ValueError(f"Version not found: {version_id}")

    return response['Item']

def delete_session(session_id: str):
    """Delete all versions for a session"""
    versions = get_versions(session_id, limit=100)

    with table.batch_writer() as batch:
        for version in versions:
            batch.delete_item(
                Key={
                    'session_id': version['session_id'],
                    'version_id': version['version_id']
                }
            )
```

#### API Endpoints

Add to `backend/lambda/handler.py`:

```python
def lambda_handler(event, context):
    """Main Lambda handler"""
    path = event.get('path', '')
    method = event.get('httpMethod', '')
    body = json.loads(event.get('body', '{}'))

    # Existing endpoint
    if path == '/generate' and method == 'POST':
        return handle_generate(body)

    # NEW: Version management endpoints
    if path == '/versions' and method == 'POST':
        return handle_save_version(body)

    if path.startswith('/versions/') and method == 'GET':
        # /versions/{session_id}
        session_id = path.split('/')[-1]
        return handle_get_versions(session_id)

    if path.startswith('/versions/') and method == 'DELETE':
        session_id = path.split('/')[-1]
        return handle_delete_session(session_id)

    return {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'})
    }

def handle_save_version(body):
    """Save version after each generation"""
    try:
        session_id = body['session_id']
        version_data = body['version_data']

        version_id = save_version(session_id, version_data)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'version_id': version_id,
                'message': 'Version saved'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_get_versions(session_id):
    """Get version history"""
    try:
        versions = get_versions(session_id)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'versions': versions,
                'count': len(versions)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_delete_session(session_id):
    """Clear session history"""
    try:
        delete_session(session_id)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Session deleted'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

#### Integration with Generation Flow

Optionally save versions automatically after generation:

```python
def generate_component(request):
    """Enhanced with auto-save to DynamoDB"""
    image_base64 = request.get("image_base64")
    previous_code = request.get("previous_code")
    modification = request.get("modification")
    style = request.get("style", "modern")
    session_id = request.get("session_id")  # NEW: Optional session ID

    # ... existing generation logic ...

    result = {
        "component": component_code,
        "description": description
    }

    # OPTIONAL: Auto-save to DynamoDB if session_id provided
    if session_id:
        try:
            save_version(session_id, {
                'component': component_code,
                'description': description,
                'modification': modification,
                'style': style
            })
        except Exception as e:
            # Don't fail generation if save fails
            print(f"Warning: Failed to save version: {e}")

    return result
```

### Phase 3: Hybrid Approach (Best of Both)

**Graceful degradation**:
1. Frontend always uses LocalStorage (instant, offline)
2. Backend syncs to DynamoDB when online (optional)
3. If DynamoDB fails → app still works via LocalStorage
4. When user switches devices → fetch from DynamoDB

```python
# Frontend sync strategy
async function syncVersions() {
  try {
    // Try to upload local versions to backend
    const localVersions = JSON.parse(localStorage.getItem('versions'));
    await fetch(`${API_URL}/versions/sync`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        versions: localVersions
      })
    });
  } catch (error) {
    // Sync failed, but LocalStorage still works
    console.warn('Version sync failed, using local only:', error);
  }
}
```

---

## 2.2 Alternative: S3-based Version Storage

If you want persistence WITHOUT DynamoDB setup:

### S3 JSON Files Approach

```python
import boto3
import json

s3 = boto3.client('s3')
BUCKET = 'sketch2app-versions'

def save_version_s3(session_id: str, version_data: Dict) -> str:
    """Save version as JSON file in S3"""
    version_id = f"v{int(datetime.now().timestamp() * 1000)}"
    key = f"sessions/{session_id}/versions/{version_id}.json"

    # Add metadata
    version_data['version_id'] = version_id
    version_data['timestamp'] = datetime.now().isoformat()

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(version_data),
        ContentType='application/json',
        Metadata={
            'session_id': session_id,
            'version_id': version_id
        }
    )

    return version_id

def list_versions_s3(session_id: str) -> List[Dict]:
    """List all versions for session"""
    prefix = f"sessions/{session_id}/versions/"

    response = s3.list_objects_v2(
        Bucket=BUCKET,
        Prefix=prefix,
        MaxKeys=20
    )

    versions = []
    for obj in response.get('Contents', []):
        # Download each version file
        version_obj = s3.get_object(Bucket=BUCKET, Key=obj['Key'])
        version_data = json.loads(version_obj['Body'].read())
        versions.append(version_data)

    # Sort by timestamp
    return sorted(versions, key=lambda x: x['timestamp'], reverse=True)
```

#### Pros/Cons of S3

✅ **Pros**:
- Simple setup (bucket already exists for images)
- Cheap storage
- No provisioning needed

❌ **Cons**:
- Slow queries (must list + download all files)
- No indexing
- Not designed for this use case

**Verdict**: Only use if you REALLY don't want DynamoDB and need persistence.

---

## 2.3 Database Recommendations Summary

### For Hackathon (Day 1):
```
❌ NO DATABASE
✅ Frontend LocalStorage only
✅ Backend stays stateless
```

### For Post-Hackathon (Week 1):
```
✅ DynamoDB (primary)
✅ LocalStorage (fallback)
✅ Graceful degradation
```

### For Production (Month 1):
```
✅ DynamoDB + Cognito
✅ User accounts + auth
✅ Cross-device sync
✅ Analytics + monitoring
```

### Cost Comparison (1000 users, 10 versions/user)

| Solution | Storage | Requests | Total/month |
|----------|---------|----------|-------------|
| LocalStorage | $0 | $0 | **$0** |
| DynamoDB | $0 (free tier) | $0 (25 WCU/RCU free) | **$0** |
| S3 | $0.023 | $0.0004 | **$0.03** |
| RDS (t3.micro) | Included | N/A | **$15** |

**Winner for hackathon**: LocalStorage (zero cost, zero setup)
**Winner for production**: DynamoDB (scalable, free tier covers small apps)

---

## 3. Version History & Time Travel (Legacy — See Section 2)

**NOTE**: This section is superseded by Section 2 (Database Strategy).
For hackathon, use **LocalStorage** (frontend-only).
For production, use **DynamoDB** (see Section 2.1).

### Problem
Users can't go back to previous versions of generated code. One bad modification destroys all previous work.

### Solution (Post-Hackathon Only)
Store version history of all generations in DynamoDB with timestamp, modification prompt, and full code snapshot.

**For hackathon**: Frontend handles this with LocalStorage. Backend does nothing.

### API Changes
```python
# New endpoints
POST /api/versions/{session_id}/list
POST /api/versions/{session_id}/restore/{version_id}

# DynamoDB schema
{
  "session_id": "uuid",
  "version_id": "v1_1234567890",
  "timestamp": "2025-01-15T10:30:00Z",
  "component_code": "...",
  "description": "Login form with email and password",
  "modification_prompt": "Add forgot password link",
  "parent_version": "v0_1234567880",
  "style": "modern"
}
```

### Frontend Integration
- Add timeline slider below preview
- Show version badges: v1, v2, v3...
- Click to restore any previous version
- Visual diff between versions

### Cost Estimate
- DynamoDB: ~$0.01 per 100 versions (on-demand)
- S3 for code snapshots: ~$0.023 per GB/month

---

## 3. Multi-Format Code Export

### Problem
Users can only get React code. Need other frameworks/formats.

### Solution
Add post-processing layer to convert React code to other formats using AI or templates.

### Supported Formats
1. **React + TypeScript** (current)
2. **Vue 3 Composition API**
3. **Svelte**
4. **HTML + Tailwind CSS** (static)
5. **React Native** (mobile)
6. **Flutter** (Dart)

### API Changes
```python
POST /api/export
{
  "session_id": "uuid",
  "format": "vue" | "svelte" | "html" | "react-native" | "flutter",
  "component_code": "..."
}

Response:
{
  "code": "...",
  "dependencies": ["vue@3.4.0", "tailwindcss@3.4.0"],
  "entry_file": "App.vue"
}
```

### Implementation Strategy
- **Vue/Svelte**: Use Claude to convert React → Vue/Svelte (add ~2s latency)
- **HTML**: Strip React syntax, keep structure
- **React Native**: Replace web components with RN primitives
- **Flutter**: Convert to Dart widgets (hardest, may need specialized model)

### Hackathon Priority
Low (P2) — Nice to have, not essential for demo

---

## 4. Real-Time Collaboration (WebSocket)

### Problem
Only one person can work on a sketch at a time. No team collaboration.

### Solution
Multi-user sessions with real-time sync via WebSocket (API Gateway WebSocket).

### Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User A     │────▶│  API Gateway │────▶│  Lambda     │
│  Browser    │◀────│  WebSocket   │◀────│  Handler    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │                    ▼                    ▼
       │            ┌──────────────┐     ┌─────────────┐
       └───────────▶│  DynamoDB    │     │  S3         │
                    │  Connections │     │  Shared     │
                    └──────────────┘     │  State      │
                                         └─────────────┘
```

### Message Types
```typescript
// Client → Server
{
  "action": "join" | "modify" | "leave",
  "session_id": "uuid",
  "user_id": "user123",
  "modification": "Add button shadow"
}

// Server → All Clients
{
  "type": "user_joined" | "code_updated" | "user_left",
  "user_id": "user123",
  "component_code": "...",
  "cursor_position": { "x": 100, "y": 200 }
}
```

### Frontend Changes
- Show active users list (avatars)
- Real-time cursor tracking (like Figma)
- Conflict resolution (last write wins or operational transform)

### Cost Estimate
- API Gateway WebSocket: $1.00 per million messages
- Lambda invocations: $0.20 per million
- DynamoDB connections table: ~$0.01 per 1000 connections

### Hackathon Priority
Medium (P1) — Great demo wow factor, but complex

---

## 5. AI Suggestions & Auto-Improvements

### Problem
Users don't know what to ask for. AI could proactively suggest improvements.

### Solution
After each generation, run Claude analysis on the code to suggest 3 enhancements.

### API Flow
```python
# After generation completes
generated_code = bedrock_response["component"]

# Async suggestion generation (non-blocking)
suggestions = analyze_code_with_claude(generated_code)

# Return to frontend
{
  "component": "...",
  "description": "...",
  "suggestions": [
    {
      "title": "Add loading state",
      "description": "Show spinner while form submits",
      "prompt": "Add a loading spinner to the submit button"
    },
    {
      "title": "Improve accessibility",
      "description": "Add ARIA labels to form inputs",
      "prompt": "Add proper ARIA labels and roles for screen readers"
    },
    {
      "title": "Add validation",
      "description": "Email format validation",
      "prompt": "Add email validation with error message"
    }
  ]
}
```

### Prompt Template
```python
SUGGESTION_PROMPT = """
Analyze this React component and suggest 3 practical improvements:

{component_code}

For each suggestion:
1. Title (max 5 words)
2. Description (1 sentence)
3. Modification prompt (how to implement it)

Focus on: UX, accessibility, error handling, loading states.
Return as JSON array.
"""
```

### Frontend Display
- Show suggestions as clickable chips below preview
- Click chip → auto-apply modification
- "✨ AI Suggestions" panel

### Cost Estimate
- +1 additional Claude API call per generation (~$0.003)
- +0.5s latency (run async to avoid blocking)

### Hackathon Priority
High (P0) — Easy to implement, great demo value

---

## 6. Template Library & Quick Start

### Problem
Empty canvas is intimidating. Users need starting points.

### Solution
Pre-built template library stored in S3, instantly loadable.

### Templates
1. **Login Form** (email/password)
2. **Signup Form** (name/email/password)
3. **Dashboard Layout** (sidebar + cards)
4. **Landing Page** (hero + features)
5. **Pricing Table** (3 tiers)
6. **Blog Post** (header + content)
7. **Contact Form** (name/email/message)
8. **Settings Page** (tabs + forms)

### Storage
```json
// s3://sketch2app-templates/login-form.json
{
  "id": "login-form",
  "name": "Login Form",
  "description": "Simple email/password login",
  "preview_image": "https://...",
  "component": "import { useState } from 'react'...",
  "tags": ["auth", "form", "simple"],
  "style": "modern"
}
```

### API
```python
GET /api/templates/list
GET /api/templates/{template_id}

Response:
{
  "templates": [
    {
      "id": "login-form",
      "name": "Login Form",
      "preview_url": "https://...",
      "tags": ["auth", "form"]
    }
  ]
}
```

### Frontend Integration
- "Start from template" button in empty state
- Gallery view with preview images
- Click → instant load (no AI call needed)
- Save custom designs as templates

### Hackathon Priority
High (P0) — Easy win, makes demos reliable

---

## 7. Code Quality Analysis

### Problem
Generated code might have issues: poor accessibility, security vulnerabilities, performance problems.

### Solution
Post-process generated code through static analysis tools.

### Checks
1. **ESLint** — Code quality & best practices
2. **TypeScript Compiler** — Type errors
3. **axe-core** — Accessibility violations
4. **Lighthouse** — Performance score

### API Flow
```python
POST /api/analyze
{
  "component_code": "..."
}

Response:
{
  "quality_score": 85,
  "issues": [
    {
      "severity": "warning",
      "category": "accessibility",
      "message": "Button missing aria-label",
      "line": 42,
      "fix_prompt": "Add aria-label to the submit button"
    }
  ],
  "metrics": {
    "lines_of_code": 120,
    "complexity": "low",
    "accessibility_score": 78
  }
}
```

### Frontend Display
- Show quality badge: "Quality: 85/100"
- Expandable issues panel
- Click issue → auto-fix with AI

### Tools Integration
```bash
# Lambda layer with:
- eslint
- typescript
- @axe-core/cli
```

### Hackathon Priority
Low (P2) — Nice to have, not critical

---

## 8. Performance Optimizations

### Current Issues
- Cold start: ~3-5s first Lambda invocation
- Large prompt context: increases latency
- No caching: re-generate identical sketches

### Solutions

#### 7.1 Lambda Warm Pools
```yaml
# template.yaml
Resources:
  GenerateFunction:
    Type: AWS::Serverless::Function
    Properties:
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 2  # Keep 2 warm
```
- Cost: ~$10/month for 2 warm instances
- Benefit: Eliminate cold starts during demo

#### 7.2 Prompt Caching (Claude 3.5+)
```python
# Use Claude's prompt caching for repeated context
response = bedrock.invoke_model(
    modelId="anthropic.claude-3-5-sonnet-20250514-v2:0",
    body={
        "system": [
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"}  # Cache this
            }
        ],
        "messages": [...]
    }
)
```
- Benefit: ~90% cost reduction on cached tokens
- Latency: -40% for repeated generations

#### 7.3 Image Deduplication
```python
# Hash sketch images, cache responses
import hashlib

def get_cache_key(image_base64: str) -> str:
    return hashlib.sha256(image_base64.encode()).hexdigest()

# DynamoDB cache
cache_key = get_cache_key(request["image_base64"])
cached = cache_table.get_item(Key={"cache_key": cache_key})

if cached:
    return cached["response"]  # Instant return
```
- Benefit: Same sketch → instant response
- Great for demos (pre-cache demo sketches)

### Hackathon Priority
High (P0) — Critical for demo reliability

---

## 9. Error Recovery & Fallbacks

### Current Issues
- Bedrock API failure → user sees error, can't retry
- Malformed JSON → app crashes
- Network timeout → lost progress

### Solutions

#### 8.1 Automatic Retry with Exponential Backoff
```python
import time
from botocore.exceptions import ClientError

def invoke_bedrock_with_retry(prompt: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return bedrock.invoke_model(...)
        except ClientError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s
```

#### 8.2 Fallback to Cached Templates
```python
# If Bedrock fails, return similar template
if bedrock_failed:
    similar_template = find_similar_template(user_sketch)
    return {
        "component": similar_template["code"],
        "description": "Fallback template (AI unavailable)",
        "is_fallback": True
    }
```

#### 8.3 Progressive Enhancement
```python
# Return partial results while processing
yield {
    "status": "analyzing_image",
    "progress": 25
}

yield {
    "status": "generating_code",
    "progress": 75
}

yield {
    "status": "complete",
    "component": "...",
    "progress": 100
}
```

### Hackathon Priority
Medium (P1) — Important for production feel

---

## Implementation Roadmap

### Phase 1: Hackathon Core (24h)
- [x] Basic generation pipeline
- [ ] **Visual Editor Support (P0)** — 4-6h — CRITICAL
  - [ ] Accept `previous_code` + `modification` params
  - [ ] Implement modification prompt engineering
  - [ ] Add prompt caching for cost optimization
  - [ ] Test sequential modifications
- [ ] **Database: NONE** — Frontend uses LocalStorage — 0h
- [ ] Template library (4h) — OPTIONAL
- [ ] AI suggestions (2h) — OPTIONAL
- [ ] Performance optimizations (3h)
- [ ] Error retry logic (1h)

### Phase 2: Post-Hackathon (Week 1)
- [ ] Add DynamoDB for version history (4h)
- [ ] User sessions + Cognito (6h)
- [ ] Code quality analysis (6h)

### Phase 3: Production (Month 1)
- [ ] Multi-format export (12h)
- [ ] Real-time collaboration (20h)
- [ ] Advanced caching (4h)
- [ ] Monitoring & analytics (6h)

---

## Cost Breakdown (Monthly)

| Feature | AWS Services | Monthly Cost |
|---------|--------------|--------------|
| Version History | DynamoDB (on-demand) | ~$5 |
| Templates | S3 + CloudFront | ~$1 |
| Code Quality | Lambda layers | $0 (included) |
| WebSocket Collab | API Gateway WS + DynamoDB | ~$15 |
| Lambda Warm Pools | Provisioned concurrency | ~$10 |
| **Total** | | **~$31/month** |

For hackathon demo: **~$0** (free tier covers everything)

---

## Quick Wins for Demo

### Must-Have (P0)
1. ✅ **Visual Editor Support** — CRITICAL for frontend iteration loop (4-6h)
2. ✅ **Prompt Caching** — 40% faster, 90% cheaper (1h)
3. ✅ **Error Retry** — Make it feel production-ready (1h)

### Nice-to-Have (P1)
4. ✅ **Lambda Warming** — Eliminate cold starts (1h)
5. ✅ **Template Library** — Instant wow, zero AI latency (4h)
6. ✅ **AI Suggestions** — Shows intelligence (2h)

### Skip for Hackathon
- ❌ **Database** — Frontend uses LocalStorage, backend does nothing
- ❌ Real-time collaboration (too complex, 20h)
- ❌ Multi-format export (not core value prop, 12h)
- ❌ Code quality analysis (nice-to-have, 6h)

**Total recommended effort**: 6-8 hours (Visual Editor + Caching + Retry)
**With nice-to-haves**: 13-15 hours (adds Lambda warming + Templates + AI suggestions)
