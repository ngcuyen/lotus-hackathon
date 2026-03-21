import { Camera } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface InputPanelProps {
  onCapture: (image: string) => void;
  onGenerate: (image: string, prompt?: string, style?: string) => void;
  style?: string;
}

export function InputPanel({ onCapture, onGenerate, style }: InputPanelProps) {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{
        backgroundColor: "var(--scifi-bg)",
        borderRight: "1px solid rgba(0, 212, 255, 0.2)",
      }}
    >
      {/* Input Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
          backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" style={{ color: "var(--scifi-cyan)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
          >
            INPUT
          </span>
        </div>
      </div>

      {/* Camera Capture */}
      <div className="flex-1 relative overflow-hidden">
        <CameraCapture onCapture={onCapture} onGenerate={onGenerate} style={style} />
      </div>
    </div>
  );
}
