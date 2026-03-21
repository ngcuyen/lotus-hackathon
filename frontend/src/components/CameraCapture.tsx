import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, Pencil, X, FlipHorizontal, Zap } from "lucide-react";
import { ScifiButton } from "./scifi/ScifiButton";

interface Props {
  onCapture: (imageBase64: string) => void;
  currentImage: string | null;
}

type Mode = "idle" | "camera" | "draw";

export function CameraCapture({ onCapture, currentImage }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  // ─── Camera capture ───
  const capturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      // screenshot is already base64 data URL
      const base64 = screenshot.split(",")[1];
      onCapture(base64);
      setMode("idle");
    }
  }, [onCapture]);

  // ─── File upload ───
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  // ─── Canvas drawing ───
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawingRef.current = true;
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const stopDrawing = useCallback(() => {
    drawingRef.current = false;
  }, []);

  const submitDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    onCapture(base64);
    setMode("idle");
  }, [onCapture]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ─── Render: Show captured image ───
  if (currentImage) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div
          className="relative overflow-hidden"
          style={{
            border: "2px solid var(--scifi-green)",
            boxShadow: "0 0 20px rgba(57, 255, 20, 0.3)",
          }}
        >
          <img
            src={`data:image/png;base64,${currentImage}`}
            alt="Captured sketch"
            className="max-h-[400px] object-contain"
          />
          <div
            className="absolute top-3 right-3 px-3 py-1"
            style={{
              backgroundColor: "var(--scifi-green)",
              color: "var(--scifi-bg)",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.65rem",
              fontWeight: "bold",
              letterSpacing: "0.05em",
              clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
            }}
          >
            ✓ CAPTURED
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Drawing mode ───
  if (mode === "draw") {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
          >
            DRAW YOUR WIREFRAME
          </span>
          <div className="flex gap-2">
            <ScifiButton variant="ghost" onClick={clearCanvas} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
              CLEAR
            </ScifiButton>
            <button
              onClick={() => setMode("idle")}
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "transparent",
                border: "1px solid var(--scifi-orange)",
                color: "var(--scifi-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-hidden bg-white"
          style={{
            border: "2px solid var(--scifi-cyan)",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full sketch-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        <div className="flex justify-end">
          <ScifiButton variant="cta" onClick={submitDrawing}>
            <Zap className="w-4 h-4" />
            GENERATE APP
          </ScifiButton>
        </div>
      </div>
    );
  }

  // ─── Render: Camera mode ───
  if (mode === "camera") {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
          >
            POINT CAMERA AT YOUR SKETCH
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "transparent",
                border: "1px solid var(--scifi-cyan)",
                color: "var(--scifi-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode("idle")}
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "transparent",
                border: "1px solid var(--scifi-orange)",
                color: "var(--scifi-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-hidden"
          style={{
            border: "2px solid var(--scifi-cyan)",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
          }}
        >
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode, width: 1280, height: 720 }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex justify-center">
          <ScifiButton variant="cta" onClick={capturePhoto}>
            <Camera className="w-4 h-4" />
            CAPTURE
          </ScifiButton>
        </div>
      </div>
    );
  }

  // ─── Render: Idle — choose input mode ───
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-base font-bold uppercase tracking-wider mb-1.5"
          style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
        >
          CAPTURE YOUR SKETCH
        </h2>
        <p className="text-xs" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
          Draw on paper, whiteboard, or iPad — then capture it
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        <ScifiButton
          variant="filled-cyan"
          onClick={() => setMode("camera")}
          style={{ width: "100%", height: "48px", justifyContent: "flex-start", alignItems: "center", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "0.625rem" }}
        >
          <Camera className="w-4 h-4" style={{ flexShrink: 0 }} />
          <div className="text-left flex-1">
            <div className="font-bold text-xs">CAMERA</div>
            <div className="text-[10px] opacity-60">Snap a photo with your device</div>
          </div>
        </ScifiButton>

        <ScifiButton
          variant="outline-cyan"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: "100%", height: "48px", justifyContent: "flex-start", alignItems: "center", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "0.625rem" }}
        >
          <Upload className="w-4 h-4" style={{ flexShrink: 0 }} />
          <div className="text-left flex-1">
            <div className="font-bold text-xs">UPLOAD IMAGE</div>
            <div className="text-[10px] opacity-60">Select from your device</div>
          </div>
        </ScifiButton>

        <ScifiButton
          variant="outline-cyan"
          onClick={() => {
            setMode("draw");
            // Init canvas with white bg after render
            setTimeout(() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }, 50);
          }}
          style={{ width: "100%", height: "48px", justifyContent: "flex-start", alignItems: "center", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "0.625rem" }}
        >
          <Pencil className="w-4 h-4" style={{ flexShrink: 0 }} />
          <div className="text-left flex-1">
            <div className="font-bold text-xs">DRAW ON SCREEN</div>
            <div className="text-[10px] opacity-60">Create wireframe directly</div>
          </div>
        </ScifiButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
