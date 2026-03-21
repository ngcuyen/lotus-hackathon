# Sketch → Living App

## Vision

**"The bridge between physical whiteboard and living software."**

A real-time tool that converts hand-drawn wireframe sketches (on paper, whiteboard, or iPad) into fully functional React applications — instantly, visually, without writing a single line of code. Users draw on physical surfaces, point a camera, and watch their app come alive on screen.

This is NOT another "sketch-to-code" tool. This is a **physical-to-digital design bridge** — the first tool that starts from paper and marker, not from a text prompt or digital canvas.

---

## Context

- **Event**: Hackathon (24 hours, international judges)
- **Team**: 2 people (Person A: Frontend/UI, Person B: AI/Backend)
- **Track**: Consumer & Technology (leveraging AWS services)
- **Key constraint**: Judges include non-Vietnamese speakers → product must be **visually self-explanatory**. Demo should require zero verbal explanation.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Camera /    │────▶│  AWS Lambda +    │────▶│  Sandpack Live  │
│  Upload /    │     │  Bedrock Claude  │     │  Preview        │
│  Draw Canvas │     │  (Vision + Code) │     │  (React render) │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                                              │
       │              ┌──────────────┐                │
       └──────────────│  Iteration   │◀───────────────┘
         re-sketch    │  Loop        │  click-to-edit
                      └──────────────┘
```

### Core Pipeline (single API call)

1. **Input**: Camera capture / file upload / canvas drawing → base64 image
2. **AI Processing**: Image → Lambda → Bedrock Claude Sonnet (Vision) → structured JSON `{component, description}`
3. **Rendering**: JSON → Sandpack (in-browser React sandbox) → live interactive app
4. **Iteration**: User modifies sketch OR clicks element in preview → re-send to AI with context → updated app

### AWS Services Used

| Service | Purpose | Why |
|---------|---------|-----|
| **Bedrock (Claude Sonnet)** | Vision analysis + React code generation | Single API call handles both image understanding and code gen |
| **Lambda** | Orchestration, prompt management, error handling | Serverless, no infra to manage during hackathon |
| **API Gateway** | REST + WebSocket endpoints | CORS handling, rate limiting, WebSocket for streaming |
| **S3** | Image storage, sketch history | Debugging, history replay during demo |
| **Amplify** | Frontend hosting + CI/CD | One-command deploy from GitHub |
| **CloudFront** | CDN for frontend | Fast loading during demo |

---

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.4
- **Live preview**: `@codesandbox/sandpack-react` (in-browser React sandbox)
- **Camera**: `react-webcam` (WebRTC access)
- **Animation**: `framer-motion` (transitions, loading states)
- **Icons**: `lucide-react`
- **Code display**: `prism-react-renderer`

### Backend
- **Runtime**: Python 3.12 on Lambda
- **AI**: `boto3` bedrock-runtime client
- **IaC**: AWS SAM template (`template.yaml`)

### Development
- **Package manager**: npm
- **Linting**: TypeScript strict mode
- **Deploy**: `sam build && sam deploy` (backend), `npm run build` + Amplify (frontend)

---

## Project Structure

```
sketch2app/
├── claude.md                          # This file
├── specs/                             # Feature specifications
│   ├── 01-camera-capture.spec.md
│   ├── 02-ai-pipeline.spec.md
│   ├── 03-live-preview.spec.md
│   ├── 04-visual-editing.spec.md
│   ├── 05-continuous-capture.spec.md
│   └── 06-iteration-loop.spec.md
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # Main split-screen layout
│       ├── index.css
│       ├── components/
│       │   ├── CameraCapture.tsx      # Spec 01
│       │   ├── LivePreview.tsx        # Spec 03
│       │   ├── VisualEditor.tsx       # Spec 04 (click-to-edit overlay)
│       │   ├── ContinuousCapture.tsx  # Spec 05 (whiteboard mode)
│       │   ├── CodePanel.tsx
│       │   └── ProcessingOverlay.tsx
│       ├── hooks/
│       │   ├── useSketchToApp.ts      # Spec 02 + 06
│       │   └── useElementSelector.ts  # Spec 04
│       └── api/
│           └── generate.ts
└── backend/
    ├── template.yaml                  # AWS SAM
    └── lambda/
        ├── handler.py                 # Spec 02
        ├── prompts.py                 # Prompt engineering
        └── requirements.txt
```

---

## Coding Conventions

### TypeScript / React
- Functional components only, hooks for state/effects
- Props interfaces defined inline or co-located
- `useCallback` for functions passed as props to children
- State management via React hooks only (no external stores)
- File naming: PascalCase for components, camelCase for hooks/utils
- Prefer early returns over nested conditionals
- All component files export a single named export

### Python / Lambda
- Type hints on all function signatures
- Docstrings on public functions
- `_private_function` naming for internal helpers
- Always return structured `_response(status_code, body)` from handlers
- `temperature: 0.3` for code gen (lower = more consistent output)

### Styling
- Tailwind utility classes — no custom CSS except `index.css` base layer
- Design palette: `neutral-*` for surfaces/text, `emerald-*` for success, `red-*` for errors, `amber-*` for warnings
- Motion: `framer-motion` for enter/exit/layout animations, Tailwind `transition-*` for hover micro-interactions
- Spacing: `gap-*` over margin where possible

### Error Handling
- Frontend: try-catch in hooks, render error state in UI, always offer retry
- Backend: try-catch in handler, structured JSON error responses, CloudWatch logs
- AI output: always parse with fallback — JSON fail → treat as raw code → wrap in default export
- Demo safety: pre-cached responses for 3 demo scenarios as offline fallback

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview engine | Sandpack | Full React runtime, hot reload, error boundaries, TS support — raw iframe would need a build step |
| AI pipeline | Single Bedrock call | Claude Vision handles image + code gen in one call — no separate Rekognition step needed |
| Model | Claude Sonnet 4 | 3-5x faster than Opus, comparable code quality for UI generation. Demo speed > marginal quality gain |
| Output format | JSON `{component, description}` | More reliable parsing than extracting code from freeform text. `description` powers the "AI detected: ..." UX |
| Database | None (S3 only) | 24h hackathon — S3 for images, in-memory state for sessions. DynamoDB adds setup time without demo value |
| Visual editing | Click-to-select + AI modify | Best WOW-to-effort ratio. Full drag-and-drop (Figma-like) is 40h+ work — impossible in scope |

---

## Demo Strategy

### Three-act structure

| Act | What | Why | Risk level |
|-----|------|-----|------------|
| 1. Safe open | Pre-drawn login form sketch → camera → app in 5s | Build credibility | Low |
| 2. Iterative power | Click element → modify + draw more → app updates | Show differentiation | Medium |
| 3. Crowd pleaser | Judge draws live on whiteboard → app materializes | Pure magic, no language needed | High |

### Fallback chain
1. Primary: Live Bedrock API call
2. Backup: Pre-cached responses for 3 demo scenarios
3. Emergency: Local proxy replaying saved responses
4. Last resort: Pre-recorded video of successful demo

---

## Timeline

| Phase | Hours | Person A (Frontend) | Person B (Backend) | Gate |
|-------|-------|--------------------|--------------------|------|
| Setup | 0-2h | Vite + Tailwind + Sandpack scaffold | SAM + Lambda + Bedrock access | Can capture image AND call Bedrock |
| Core | 2-6h | Camera UI + split-screen + Sandpack render | Prompt engineering + JSON output + streaming | **End-to-end demo works** |
| Polish | 6-10h | Edit mode, history, code panel | Multi-turn context, few-shot, caching | Iteration loop works |
| WOW | 10-14h | Visual editing overlay, animations | Voice/text modify, deploy to Amplify | Click-to-edit works |
| Demo | 14-18h | 3 demo scenarios, landing page | Stress test, offline fallback, monitoring | 3 reliable demo paths |
| Ship | 18-24h | UI polish, rehearsal | Warm Lambda, backup plan, video record | **Ship it** |

---

## Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod

# Backend (Lambda)
S3_BUCKET=sketch2app-images-{account-id}
MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
AWS_REGION=us-east-1
```

---

## Quick Commands

```bash
# Frontend dev
cd frontend && npm install && npm run dev          # localhost:3000

# Backend local
cd backend && sam build && sam local start-api     # localhost:4000

# Deploy backend
cd backend && sam build && sam deploy --guided     # First time
cd backend && sam build && sam deploy              # Subsequent

# Deploy frontend
cd frontend && npm run build                       # Build static
# Push to GitHub → Amplify auto-deploys
```

---

## Spec Index

Each spec file follows the format: **Problem → Solution → API contract → Implementation → Acceptance criteria → Edge cases**.

| # | Spec | Owner | Priority | Est. hours |
|---|------|-------|----------|-----------|
| 01 | [Camera Capture](specs/01-camera-capture.spec.md) | Person A | P0 | 2h |
| 02 | [AI Pipeline](specs/02-ai-pipeline.spec.md) | Person B | P0 | 4h |
| 03 | [Live Preview](specs/03-live-preview.spec.md) | Person A | P0 | 2h |
| 04 | [Visual Editing](specs/04-visual-editing.spec.md) | Person A | P1 | 4h |
| 05 | [Continuous Capture](specs/05-continuous-capture.spec.md) | Person A | P1 | 2h |
| 06 | [Iteration Loop](specs/06-iteration-loop.spec.md) | Person B | P1 | 3h |
