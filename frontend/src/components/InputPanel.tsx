import { Camera, Zap } from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import { DEMO_SKETCHES, type DemoSketch } from "../utils/demoSketches";

interface InputPanelProps {
  onCapture: (image: string) => void;
  onDemoSelect: (sketch: DemoSketch) => void;
  sketchImage: string | null;
  purposes: { id: string; name: string }[];
  selectedPurpose: string | null;
  onSelectPurpose: (id: string | null) => void;
}

export function InputPanel({
  onCapture,
  onDemoSelect,
  sketchImage,
  purposes,
  selectedPurpose,
  onSelectPurpose,
}: InputPanelProps) {
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
          backgroundImage:
            "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
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
              border: `1px solid ${
                selectedPurpose === p.id ? "var(--scifi-orange)" : "rgba(0, 212, 255, 0.2)"
              }`,
              backgroundColor:
                selectedPurpose === p.id ? "rgba(255, 106, 0, 0.15)" : "transparent",
              color:
                selectedPurpose === p.id ? "var(--scifi-orange)" : "var(--scifi-text-dim)",
              clipPath:
                "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
            }}
          >
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Demo Examples */}
      <div
        className="px-3 py-2"
        style={{ borderBottom: "1px solid rgba(0, 212, 255, 0.1)" }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3" style={{ color: "var(--scifi-green)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}
          >
            TRY EXAMPLES
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_SKETCHES.map((sketch) => (
            <button
              key={sketch.id}
              onClick={() => onDemoSelect(sketch)}
              style={{
                padding: "6px 8px",
                backgroundColor: "transparent",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                clipPath:
                  "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.06)";
                e.currentTarget.style.borderColor = "var(--scifi-cyan)";
                e.currentTarget.style.boxShadow = "0 0 8px rgba(0, 212, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ fontSize: "0.9rem" }}>{sketch.emoji}</span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    color: "var(--scifi-cyan)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {sketch.name}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.55rem",
                  fontFamily: "'Courier New', monospace",
                  color: "var(--scifi-text-dim)",
                  lineHeight: 1.3,
                }}
              >
                {sketch.tagline}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Camera Capture */}
      <div className="flex-1 relative overflow-hidden">
        <CameraCapture onCapture={onCapture} currentImage={sketchImage} />
      </div>
    </div>
  );
}
