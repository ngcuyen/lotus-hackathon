import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, Pencil, X, FlipHorizontal } from "lucide-react";

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
      <div className="h-full flex items-center justify-center">
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
          <img
            src={`data:image/png;base64,${currentImage}`}
            alt="Captured sketch"
            className="max-h-[400px] object-contain"
          />
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Captured
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
          <span className="text-xs text-neutral-500">Draw your wireframe</span>
          <div className="flex gap-2">
            <button onClick={clearCanvas} className="btn-ghost text-xs">
              Clear
            </button>
            <button onClick={() => setMode("idle")} className="btn-ghost text-xs">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 border-2 border-dashed border-neutral-300 rounded-xl overflow-hidden bg-white">
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
        <button onClick={submitDrawing} className="btn-primary self-end">
          Generate from drawing
        </button>
      </div>
    );
  }

  // ─── Render: Camera mode ───
  if (mode === "camera") {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Point camera at your sketch</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
              className="btn-ghost text-xs"
            >
              <FlipHorizontal className="w-3 h-3" />
            </button>
            <button onClick={() => setMode("idle")} className="btn-ghost text-xs">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode, width: 1280, height: 720 }}
            className="w-full h-full object-cover"
          />
        </div>
        <button onClick={capturePhoto} className="btn-primary self-center px-8">
          <Camera className="w-4 h-4 mr-2 inline" />
          Capture
        </button>
      </div>
    );
  }

  // ─── Render: Idle — choose input mode ───
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-800">Capture your sketch</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Draw on paper, whiteboard, or iPad — then capture it
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setMode("camera")}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed
                       border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50
                       transition-all w-36"
          >
            <Camera className="w-6 h-6 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Camera</span>
            <span className="text-[10px] text-neutral-400">Snap a photo</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed
                       border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50
                       transition-all w-36"
          >
            <Upload className="w-6 h-6 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Upload</span>
            <span className="text-[10px] text-neutral-400">From device</span>
          </button>

          <button
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
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed
                       border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50
                       transition-all w-36"
          >
            <Pencil className="w-6 h-6 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Draw</span>
            <span className="text-[10px] text-neutral-400">On screen</span>
          </button>
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
    </div>
  );
}
