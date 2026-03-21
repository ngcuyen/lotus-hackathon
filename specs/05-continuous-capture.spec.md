# Spec 05 — Continuous Capture (Whiteboard Session Mode)

**Owner**: Person A (Frontend)
**Priority**: P1 (WOW feature — target hours 10-14)
**Estimated effort**: 2 hours
**Component**: `src/components/ContinuousCapture.tsx`

---

## Problem

The hero demo scenario is: a judge stands at a whiteboard, draws with a marker, and watches the app evolve on a projector/screen nearby. This requires the camera to continuously watch the whiteboard and detect when the drawing has changed — without the user pressing "capture" each time.

This is the **"physical-to-digital bridge"** that differentiates us from every digital-first tool.

## Solution

Continuous camera capture with smart change detection. The camera stays active, periodically takes snapshots, compares them for visual changes, and auto-triggers generation when a meaningful change is detected.

---

## User Flow

```
[User activates "Whiteboard Session" mode]
  │
  ├── Camera opens, pointed at whiteboard
  │   [Live viewfinder with status indicator]
  │     │
  │     ├── User draws on whiteboard
  │     │   [Change detected — "Analyzing..." indicator]
  │     │   [3-second stability wait — user might still be drawing]
  │     │   [Auto-capture → send to AI → preview updates]
  │     │
  │     ├── User draws more
  │     │   [Change detected again → new capture → AI updates app]
  │     │
  │     └── User stops drawing
  │         [No changes for 5s → indicator shows "Watching..."]
  │
  └── User exits Whiteboard Session mode
```

---

## Architecture

```
Camera Feed ──▶ Snapshot (every 2s) ──▶ Change Detection ──▶ Stability Check ──▶ AI Pipeline
                                              │                      │
                                              │ No change            │ Still changing
                                              ▼                      ▼
                                          [Skip]              [Wait 3s more]
```

---

## Implementation Details

### Change Detection Algorithm

Compare consecutive frames using a simple pixel-difference approach. No ML needed — this is a whiteboard with high contrast.

```typescript
function detectChange(
  prevCanvas: HTMLCanvasElement,
  currCanvas: HTMLCanvasElement,
  threshold: number = 0.05  // 5% pixel change = meaningful
): boolean {
  const prevCtx = prevCanvas.getContext('2d')!;
  const currCtx = currCanvas.getContext('2d')!;

  const prevData = prevCtx.getImageData(0, 0, prevCanvas.width, prevCanvas.height).data;
  const currData = currCtx.getImageData(0, 0, currCanvas.width, currCanvas.height).data;

  let diffPixels = 0;
  const totalPixels = prevData.length / 4;

  for (let i = 0; i < prevData.length; i += 4) {
    // Compare grayscale values (faster than RGB)
    const prevGray = (prevData[i] + prevData[i+1] + prevData[i+2]) / 3;
    const currGray = (currData[i] + currData[i+1] + currData[i+2]) / 3;

    if (Math.abs(prevGray - currGray) > 30) {
      diffPixels++;
    }
  }

  return (diffPixels / totalPixels) > threshold;
}
```

### Stability Detection

Don't trigger AI while the user is still drawing. Wait for the image to stabilize (no changes for N seconds).

```typescript
function useContinuousCapture(webcamRef, onStableCapture) {
  const prevFrameRef = useRef<HTMLCanvasElement | null>(null);
  const lastChangeTime = useRef<number>(0);
  const stabilityDelay = 3000;  // 3 seconds of no change = stable
  const captureInterval = 2000; // Check every 2 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const screenshot = webcamRef.current?.getScreenshot();
      if (!screenshot) return;

      // Draw to canvas for pixel comparison
      const currentFrame = imageToCanvas(screenshot);

      if (prevFrameRef.current) {
        const changed = detectChange(prevFrameRef.current, currentFrame);

        if (changed) {
          lastChangeTime.current = Date.now();
          setStatus('drawing');  // User is actively drawing
        } else {
          const timeSinceLastChange = Date.now() - lastChangeTime.current;

          if (timeSinceLastChange > stabilityDelay && lastChangeTime.current > 0) {
            // Stable! Auto-capture
            const base64 = screenshot.split(',')[1];
            onStableCapture(base64);
            lastChangeTime.current = 0;  // Reset to avoid re-triggering
            setStatus('processing');
          }
        }
      }

      prevFrameRef.current = currentFrame;
    }, captureInterval);

    return () => clearInterval(interval);
  }, []);
}
```

### Resolution Optimization

Full webcam frames are expensive to compare. Downscale for comparison, use full resolution for AI:

```typescript
function imageToCanvas(dataUrl: string, compareSize = 160): HTMLCanvasElement {
  const img = new Image();
  img.src = dataUrl;

  // Small canvas for comparison (160x90 = 14,400 pixels — fast)
  const canvas = document.createElement('canvas');
  canvas.width = compareSize;
  canvas.height = Math.round(compareSize * 9 / 16);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}
```

---

## UI Design

### Whiteboard Session Mode

When active, the left panel transforms into a persistent camera feed with status overlay:

```typescript
<div className="relative h-full">
  {/* Live camera feed — always visible */}
  <Webcam
    ref={webcamRef}
    className="w-full h-full object-cover rounded-xl"
    screenshotFormat="image/png"
    videoConstraints={{ facingMode: "environment", width: 1280, height: 720 }}
  />

  {/* Status indicator overlay */}
  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 text-white
                  rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
    <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
    {statusLabels[status]}
  </div>

  {/* Change detection visualization (optional, cool for demo) */}
  {status === 'drawing' && (
    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 animate-pulse" style={{ width: '60%' }} />
    </div>
  )}
</div>
```

### Status States

| Status | Indicator | Color | Label |
|--------|-----------|-------|-------|
| `watching` | Steady dot | Gray | "Watching for changes..." |
| `drawing` | Pulsing dot | Amber | "Drawing detected..." |
| `stabilizing` | Filling bar | Blue | "Waiting for you to finish..." |
| `processing` | Spinning | White | "Generating app..." |
| `ready` | Green dot | Green | "App updated" |

---

## Configuration

```typescript
interface ContinuousCaptureConfig {
  captureIntervalMs: number;    // How often to check for changes (default: 2000)
  stabilityDelayMs: number;     // How long to wait after last change (default: 3000)
  changeThreshold: number;      // Pixel diff % to count as change (default: 0.05)
  minTimeBetweenGenerations: number; // Debounce AI calls (default: 8000)
}
```

**Tuning for demo:**
- `captureIntervalMs: 1500` — slightly faster checking for snappier response
- `stabilityDelayMs: 2500` — shorter wait, judge expects faster feedback
- `changeThreshold: 0.03` — more sensitive (whiteboard has high contrast)

---

## Acceptance Criteria

- [ ] Camera stays active during entire whiteboard session
- [ ] Drawing a new element on whiteboard triggers auto-capture within 5 seconds of finishing
- [ ] No false triggers while user is actively drawing (stability check works)
- [ ] Preview updates automatically after each stable capture
- [ ] Status indicator accurately reflects current state
- [ ] Multiple sequential drawings each trigger their own generation
- [ ] Mode can be toggled on/off without disrupting current preview
- [ ] Works on both laptop webcam and phone camera

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Person walks in front of camera | Large change detected, but stabilizes quickly → likely triggers capture. Acceptable — AI will still see the whiteboard |
| Lighting changes (cloud, overhead light flicker) | Set `changeThreshold` high enough to ignore ambient changes (~5%) but catch marker strokes (~10%+) |
| Camera wobble / shake | Low-pass filter: require 2 consecutive "changed" frames before counting as real change |
| User erases part of whiteboard | Detected as change → generates updated app without the erased element |
| Very slow drawing (one line every 10s) | Each line triggers a capture-stability-generation cycle. Acceptable — shows iterative building |
| User draws text/annotations, not UI | AI handles it — text annotations may become labels/headings. Non-UI drawings get creative interpretation |
| Two people drawing simultaneously | Works fine — change detection is frame-based, not person-based |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Change detection per frame | < 50ms (downscaled comparison) |
| Drawing stops → AI call triggered | 3-4 seconds (stability delay) |
| Memory usage (continuous capture) | < 20MB (only keep 2 frames in memory) |
| CPU usage during watching | < 5% (2s interval is gentle) |
