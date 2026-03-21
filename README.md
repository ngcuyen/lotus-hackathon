# ✨ Sketch → Living App

> Draw a wireframe on paper → AI turns it into a working React app in seconds.
> Built with AWS Bedrock (Claude Vision) + React + Sandpack.

## 🏗 Architecture

```
Camera/Upload → Base64 Image
       ↓
  API Gateway → Lambda
       ↓
  Bedrock Claude Vision (Sonnet 4)
  - Analyzes sketch layout
  - Generates React + Tailwind code
       ↓
  JSON Response {component, description}
       ↓
  Sandpack Live Preview (renders in iframe)
```

## 📁 Project Structure

```
sketch2app/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx           # Main split-screen layout
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx    # Webcam + upload + draw
│   │   │   ├── LivePreview.tsx      # Sandpack React renderer
│   │   │   ├── CodePanel.tsx        # Generated code display
│   │   │   └── ProcessingOverlay.tsx # Animated loading steps
│   │   ├── hooks/
│   │   │   └── useSketchToApp.ts    # State machine for generation
│   │   └── api/
│   │       └── generate.ts          # API client (sync + stream)
│   └── package.json
│
├── backend/
│   ├── lambda/
│   │   ├── handler.py        # Lambda function (Bedrock calls)
│   │   ├── prompts.py        # 🔑 Prompt engineering (THE critical file)
│   │   └── requirements.txt
│   ├── template.yaml         # AWS SAM deployment template
│   └── dev_server.py         # Local Flask server for development
│
└── .env.example
```

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- Python 3.12+
- AWS CLI configured with Bedrock access (`aws configure`)

### Step 1: Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

### Step 2: Backend (choose one)

**Option A: With AWS credentials (real AI)**
```bash
cd backend
pip install flask flask-cors boto3
python dev_server.py
# → Running on http://localhost:4000
```

**Option B: Mock mode (no AWS needed, instant testing)**
In `frontend/src/api/generate.ts`, temporarily change:
```ts
const API_BASE = "/api";
// Change the fetch URL in generateFromSketch() to:
// `${API_BASE}/mock-generate`
```
Then run the dev_server.py — the mock endpoint returns a beautiful login form.

### Step 3: Test it!

1. Open http://localhost:3000
2. Click "Camera" or "Upload" or "Draw"
3. Capture/upload a wireframe sketch
4. Watch the AI generate a working app in ~5 seconds

## ☁️ Deploy to AWS

### Using SAM CLI

```bash
cd backend

# Build
sam build

# Deploy (first time — guided)
sam deploy --guided
# Stack name: sketch2app
# Region: us-east-1
# Confirm changes: Y

# Deploy (subsequent)
sam deploy
```

### After deployment

1. Copy the API Gateway URL from SAM output
2. Create `frontend/.env`:
   ```
   VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
   ```
3. Deploy frontend to Amplify:
   ```bash
   cd frontend
   npm run build
   # Upload dist/ to Amplify, or:
   amplify publish
   ```

### Required AWS Permissions

Your Lambda execution role needs:
- `bedrock:InvokeModel` on `arn:aws:bedrock:*::foundation-model/*`
- `bedrock:InvokeModelWithResponseStream` (same ARN)
- `s3:PutObject` on the images bucket

**Important**: Make sure Claude Sonnet 4 is enabled in your Bedrock console
(Model access → Request access for Anthropic Claude models).

## 🎯 Hackathon Demo Strategy

### Demo 1: Safe (Login Form)
- Pre-drawn sketch of a login page
- AI generates it perfectly 99% of the time
- Use this to open, build confidence

### Demo 2: Impressive (Dashboard)
- Pre-drawn sketch with sidebar, cards, chart areas
- Shows Claude can handle complex layouts
- Have a backup pre-cached response

### Demo 3: WOW (Live Draw)
- Invite a judge to draw ANYTHING on paper/whiteboard
- Camera capture → AI generates → crowd goes wild
- High risk, highest reward — save for last

### Demo Tips
- **Warm up Lambda** before demo: invoke it once 2 min before presentation
- **Offline fallback**: Pre-cache 3 responses in localStorage
- **WiFi backup**: Personal hotspot as failsafe
- **Timing**: Each demo should be under 60 seconds. Silence during AI processing builds suspense.
- **No slides needed**: The product IS the demo

## 🔑 Prompt Engineering Tips

The file `backend/lambda/prompts.py` is the most important file in the project.

### What works well:
- Forcing strict JSON output (no markdown, no explanation)
- Few-shot examples: 2-3 examples improve accuracy dramatically
- Low temperature (0.3): more consistent code output
- Explicit Tailwind class suggestions in system prompt

### Common failure modes:
- Claude outputs explanation text before/after JSON → fix with stricter system prompt
- Invalid JSX (unclosed tags) → add "validate your JSX" to prompt
- Missing `export default` → handled by `ensureDefaultExport()` in LivePreview.tsx
- Overly complex output → add "keep it simple, max 100 lines" to prompt

### Iteration loop:
1. Capture sketch → check Claude's JSON output in console
2. If code is broken, adjust system prompt
3. If layout doesn't match, add more few-shot examples
4. Repeat until 90%+ accuracy on your test sketches

## 🛡 Error Handling Checklist

- [ ] Claude returns non-JSON → `_parse_response()` falls back to raw code
- [ ] Generated code has syntax error → Sandpack shows error boundary
- [ ] Lambda cold start → pre-warm before demo
- [ ] Network timeout → retry with exponential backoff
- [ ] Camera permission denied → graceful fallback to upload/draw
- [ ] S3 upload fails → non-blocking, doesn't affect generation

## 📝 License

MIT — built for hackathon, ship it! 🚀
