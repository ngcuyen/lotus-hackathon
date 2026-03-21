# Spec 02 — AI Pipeline

**Owner**: Person B (AI/Backend)
**Priority**: P0 (Core — must work by hour 6)
**Estimated effort**: 4 hours
**Files**: `backend/lambda/handler.py`, `backend/lambda/prompts.py`

---

## Problem

Convert a base64 image of a hand-drawn wireframe into valid, self-contained React + Tailwind code that renders correctly in Sandpack. The AI must understand layout from imprecise hand-drawn sketches, generate production-quality JSX, and return structured output that the frontend can parse reliably.

## Solution

Single AWS Bedrock API call using Claude Sonnet 4 with Vision. One call does both image understanding and code generation. No multi-step pipeline, no separate OCR/detection step.

---

## API Contract

### Request

```
POST /api/generate
Content-Type: application/json

{
  "image_base64": "iVBORw0KGgo...",          // Required: raw base64 (no data URL prefix)
  "previous_code": "export default...",       // Optional: for iteration (Spec 06)
  "modification": "make the button bigger"    // Optional: text instruction for changes
}
```

### Response — Success

```json
{
  "component": "import { useState } from \"react\";\nexport default function App() { ... }",
  "description": "Login form with email, password inputs and sign-in button",
  "latency_seconds": 4.2
}
```

### Response — Error

```json
{
  "error": "Bedrock invocation failed: throttling"
}
```

---

## Prompt Engineering

This is the most critical part of the entire project. Invest 2+ hours here.

### System Prompt

```
You are a UI code generator that converts hand-drawn wireframe sketches
into React components with Tailwind CSS.

RULES:
1. Output ONLY a valid JSON object. No markdown, no backticks, no preamble.
2. JSON has exactly two fields: "component" and "description"
3. "component" is a complete, self-contained React component
4. Component must use export default function App()
5. ONLY import React hooks (useState, useEffect, useRef) — nothing else
6. Use ONLY Tailwind CSS utility classes for styling
7. Use realistic placeholder data (real names, emails, ipsum text)
8. Match the LAYOUT of the sketch as precisely as possible
9. Add hover:, focus:, transition for interactive elements
10. Mobile-first responsive design

OUTPUT FORMAT (strict JSON, no wrapping):
{"component": "...", "description": "..."}
```

### Few-Shot Examples

Include 2-3 examples in the messages array before the user's image. This improves accuracy from ~70% to ~95% for common layouts.

**Example pairs to include:**
1. Login form sketch → Login component with useState for inputs
2. Dashboard sketch → Card grid with metric numbers
3. Simple list sketch → Scrollable list with items

### Prompt Modes

| Mode | Trigger | Prompt addition |
|------|---------|-----------------|
| **First generation** | No `previous_code` | "Convert this wireframe sketch to a React component." |
| **Re-scan** | `previous_code` but no `modification` | "User updated their sketch. Here is previous code: {code}. Analyze new sketch and update." |
| **Text modify** | `previous_code` + `modification` | "Current code: {code}. User wants: {modification}. Update only what's requested." |
| **Element modify** | `previous_code` + element info (Spec 04) | "Current code: {code}. User clicked on {element}. They want: {modification}." |

### Model Configuration

```python
{
    "anthropic_version": "bedrock-2023-05-31",
    "system": SYSTEM_PROMPT,
    "messages": messages,        # few-shot + user image
    "max_tokens": 4096,          # React component can be 100-300 lines
    "temperature": 0.3,          # Low = consistent, valid code
}
```

**Why temperature 0.3**: Higher temperatures produce more creative but less syntactically valid code. For a demo, reliability > creativity. A generated component that crashes on render is worse than a boring-but-working one.

---

## Implementation Details

### Lambda Handler Flow

```
Request → Validate → Store image in S3 → Build messages → Invoke Bedrock → Parse response → Return JSON
```

### Response Parsing (critical)

Claude sometimes wraps JSON in markdown backticks or adds explanatory text. The parser must handle all variations:

```python
def _parse_claude_response(raw_text: str) -> dict:
    text = raw_text.strip()
    
    # Strip markdown fences
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    # Try JSON parse
    try:
        parsed = json.loads(text)
        return {
            "component": parsed.get("component", text),
            "description": parsed.get("description", "Generated component"),
        }
    except json.JSONDecodeError:
        # Fallback: treat entire response as code
        return {
            "component": text,
            "description": "Generated component (raw output)",
        }
```

### Streaming (bonus, Spec 02b)

For the "code appearing character by character" effect:

```python
response = bedrock.invoke_model_with_response_stream(
    modelId=MODEL_ID,
    body=json.dumps(payload),
)

for event_chunk in response["body"]:
    chunk = json.loads(event_chunk["chunk"]["bytes"])
    if chunk["type"] == "content_block_delta":
        delta = chunk["delta"].get("text", "")
        # Stream delta to frontend via WebSocket or SSE
```

**Decision**: Streaming is nice-to-have. Sync call with loading animation is sufficient for demo. Only implement streaming if core pipeline is solid by hour 6.

---

## Bedrock Configuration

### Model Access

```bash
# Enable Claude Sonnet in Bedrock console:
# AWS Console → Bedrock → Model access → Request access → Anthropic Claude Sonnet
# Region: us-east-1 (most models available here)
```

### IAM Policy for Lambda

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "arn:aws:bedrock:*::foundation-model/*"
}
```

### Cost Estimate (hackathon)

| Item | Estimate |
|------|----------|
| Input tokens per call (~image + prompt) | ~2,000 tokens |
| Output tokens per call (~component code) | ~1,500 tokens |
| Cost per call (Sonnet) | ~$0.02 |
| Total for 24h (~200 calls, testing + demo) | ~$4.00 |

---

## Acceptance Criteria

- [ ] Login form sketch → valid Login component with working useState inputs
- [ ] Dashboard sketch → card grid with realistic placeholder data
- [ ] E-commerce card sketch → product card with image placeholder, price, button
- [ ] Arbitrary wireframe → reasonable approximation of layout
- [ ] Response is always parseable JSON (or graceful fallback to raw code)
- [ ] Latency: < 8 seconds for first generation, < 5 seconds for modifications
- [ ] Error responses have clear, actionable messages
- [ ] S3 stores all input images for debugging

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Blank/empty image | Return simple "Hello World" component with message "No UI elements detected" |
| Extremely complex sketch (20+ elements) | Simplify — generate top-level layout only, note "some details may be simplified" |
| Non-UI sketch (cat drawing, math equations) | Generate a creative component inspired by the drawing (fun for demo) |
| Claude returns invalid JSX | Error boundary in Sandpack catches it; show retry button |
| Claude returns markdown-wrapped JSON | Parser strips backticks before JSON.parse |
| Bedrock rate limit / throttling | Retry once with 2s backoff; if fails again, use cached fallback |
| Lambda cold start during demo | Pre-warm: invoke Lambda 5 minutes before demo with dummy request |
| Image too large (>6MB base64) | Lambda rejects with 400 "Image too large, max 4MB" |

---

## Prompt Iteration Log

Track prompt changes and their impact. This is the engineering journal for the most critical component.

```
| Version | Change | Impact |
|---------|--------|--------|
| v1      | Basic system prompt | ~60% valid output |
| v2      | Added "strict JSON, no markdown" | ~80% valid output |
| v3      | Added few-shot examples | ~90% valid output |
| v4      | Added "export default function App()" rule | ~95% valid output |
| v5      | Temperature 0.3 → 0.2 | Marginal improvement, less creative |
| v6      | (fill during hackathon) | |
```

---

## Performance Targets

| Metric | Target | Stretch |
|--------|--------|---------|
| Bedrock latency (first gen) | < 8s | < 5s |
| Bedrock latency (modification) | < 5s | < 3s |
| JSON parse success rate | > 95% | > 99% |
| Valid JSX output rate | > 90% | > 95% |
| Lambda cold start | < 3s | < 1s (provisioned) |
