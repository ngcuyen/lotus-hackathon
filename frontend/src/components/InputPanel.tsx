import { Camera, Zap, Lock, ShoppingCart, MessageSquare, BarChart3 } from "lucide-react";
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
          {DEMO_SKETCHES.map((sketch) => {
            const IconComponent =
              sketch.id === "login" ? Lock :
              sketch.id === "shop" ? ShoppingCart :
              sketch.id === "chat" ? MessageSquare :
              BarChart3;

            return (
              <button
                key={sketch.id}
                onClick={() => onDemoSelect(sketch)}
                style={{
                  padding: "8px 10px",
                  backgroundColor: "rgba(0, 212, 255, 0.03)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.03)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className="w-4 h-4" style={{ color: "#ffffff" }} />
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      fontFamily: "'Courier New', monospace",
                      color: "#ffffff",
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
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 1.4,
                  }}
                >
                  {sketch.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Capture */}
      <div className="flex-1 relative overflow-hidden">
        <CameraCapture onCapture={onCapture} currentImage={sketchImage} />
      </div>
    </div>
  );
}
