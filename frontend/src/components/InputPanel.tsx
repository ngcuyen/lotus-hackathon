import { Camera } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface InputPanelProps {
  onCapture: (image: string) => void;
  sketchImage: string | null;
  purposes: { id: string; name: string }[];
  selectedPurpose: string | null;
  onSelectPurpose: (id: string | null) => void;
}

export function InputPanel({ onCapture, sketchImage, purposes, selectedPurpose, onSelectPurpose }: InputPanelProps) {
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

      {/* Purpose selector */}
      <div
        className="px-3 py-2 flex flex-wrap gap-1"
        style={{ borderBottom: "1px solid rgba(0, 212, 255, 0.1)" }}
      >
        {purposes.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPurpose(selectedPurpose === p.id ? null : p.id)}
            style={{
              padding: "3px 8px",
              fontSize: "0.6rem",
              fontFamily: "'Courier New', monospace",
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: `1px solid ${selectedPurpose === p.id ? "var(--scifi-orange)" : "rgba(0, 212, 255, 0.2)"}`,
              backgroundColor: selectedPurpose === p.id ? "rgba(255, 106, 0, 0.15)" : "transparent",
              color: selectedPurpose === p.id ? "var(--scifi-orange)" : "var(--scifi-text-dim)",
              clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
            }}
          >
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Camera Capture */}
      <div className="flex-1 relative overflow-hidden">
        <CameraCapture onCapture={onCapture} currentImage={sketchImage} />
      </div>
    </div>
  );
}
