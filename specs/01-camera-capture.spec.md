# Spec 01 — Camera Capture

**Owner**: Person A (Frontend)
**Priority**: P0 (Core — must work by hour 2)
**Estimated effort**: 2 hours
**Component**: `src/components/CameraCapture.tsx`

---

## Problem

Users need to get their hand-drawn sketch into the system. The input method must feel instant, work on both desktop and mobile, and support the demo scenario where a judge draws on a whiteboard and someone captures it with a phone/laptop camera.

## Solution

Three input modes in one component, with camera as the hero path:

1. **Camera** — WebRTC live viewfinder → tap to capture (primary, hero demo path)
2. **Upload** — File picker with `accept="image/*" capture="environment"` (fallback, also enables mobile camera sheet)
3. **Draw** — HTML5 Canvas for on-screen drawing (alternative demo path, no physical sketch needed)

---

## User Flow

```
[Idle Screen]
  ├── Click "Camera"  → [Live viewfinder] → Click "Capture" → base64 image → onCapture()
  ├── Click "Upload"  → [File picker]     → Select file     → base64 image → onCapture()
  └── Click "Draw"    → [Canvas]          → Draw wireframe   → Click "Generate" → base64 image → onCapture()
```

---

## Component API

```typescript
interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;  // base64 WITHOUT data URL prefix
  currentImage: string | null;                // Show captured image when set
}
```

### Output contract
- `imageBase64`: raw base64 string (NO `data:image/png;base64,` prefix — backend expects raw)
- Image format: PNG preferred, JPEG acceptable
- Resolution: 1280x720 from camera, original resolution from upload, 800x600 from canvas

---

## Implementation Details

### Camera Mode

```typescript
// Dependencies
import Webcam from "react-webcam";

// Key config
const videoConstraints = {
  facingMode: facingMode,      // "user" or "environment"
  width: 1280,
  height: 720,
};

// Capture
const screenshot = webcamRef.current.getScreenshot();  // returns data URL
const base64 = screenshot.split(",")[1];                // strip prefix
```

**Camera flip**: Include a toggle between front/back camera. Judges at hackathon may use either laptop screen camera (pointing at paper) or phone rear camera (pointing at whiteboard).

### Upload Mode

```typescript
const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = (reader.result as string).split(",")[1];
    onCapture(base64);
  };
  reader.readAsDataURL(file);
};
```

**Mobile shortcut**: `<input accept="image/*" capture="environment">` opens the native camera sheet on mobile — no WebRTC permission prompt needed. This is the fastest path for mobile demo.

### Draw Mode

```typescript
// Canvas setup: 800x600, white background
const canvas = canvasRef.current;
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, 800, 600);

// Drawing: black stroke, 3px width, round caps
ctx.strokeStyle = "#171717";
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.lineJoin = "round";

// Mouse-to-canvas coordinate mapping (canvas may be CSS-scaled)
const rect = canvas.getBoundingClientRect();
const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
```

**Touch support** (for iPad demo): Map `onTouchStart/Move/End` to the same draw logic. Use `e.touches[0].clientX/Y`.

---

## UI States

| State | Display |
|-------|---------|
| Idle | Three input mode buttons (Camera, Upload, Draw) centered |
| Camera active | Live viewfinder + Capture button + Flip button + Close |
| Drawing | Canvas + Clear button + Close button + "Generate from drawing" button |
| Captured | Captured image with "Captured" badge, no controls (parent takes over) |

---

## Acceptance Criteria

- [ ] Camera viewfinder opens without delay on Chrome/Safari (both desktop and mobile)
- [ ] Captured image is clear enough for Claude Vision to read handwriting at arm's length
- [ ] Upload works with PNG, JPG, HEIC (iPhone photos)
- [ ] Draw canvas produces clean black-on-white images
- [ ] All three paths output the same format: raw base64 string via `onCapture`
- [ ] Camera flip works on devices with multiple cameras
- [ ] Component handles permission denied gracefully (show Upload as fallback)

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Camera permission denied | Show toast "Camera access denied", auto-switch to Upload mode |
| Very large image (>10MB) | Resize client-side to max 1280px wide before base64 encoding |
| HEIC format (iPhone) | `FileReader.readAsDataURL` handles HEIC → browser auto-converts |
| Dark/blurry photo | Pass through — AI will return lower-quality output; user can retake |
| No camera available (desktop without webcam) | Hide Camera option, show Upload + Draw only |
| Touch drawing on small phone | Set minimum canvas display height 300px, increase stroke width to 5px |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Camera open → viewfinder visible | < 1 second |
| Capture → base64 ready | < 200ms |
| Upload → base64 ready | < 500ms (for ~2MB image) |
| Canvas export → base64 | < 100ms |
