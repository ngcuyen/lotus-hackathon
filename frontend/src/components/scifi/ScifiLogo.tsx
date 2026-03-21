import { useEffect, useRef } from "react";

interface ScifiLogoProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

// 5x7 dot matrix font patterns (simplified ASCII)
const FONT_5X7: Record<string, number[]> = {
  S: [0x7e, 0x81, 0x80, 0x7e, 0x01, 0x81, 0x7e],
  K: [0x81, 0x42, 0x24, 0x18, 0x24, 0x42, 0x81],
  E: [0xff, 0x80, 0x80, 0xfe, 0x80, 0x80, 0xff],
  T: [0xff, 0x08, 0x08, 0x08, 0x08, 0x08, 0x08],
  C: [0x7e, 0x81, 0x80, 0x80, 0x80, 0x81, 0x7e],
  H: [0x81, 0x81, 0x81, 0xff, 0x81, 0x81, 0x81],
  "2": [0x7e, 0x01, 0x01, 0x7e, 0x80, 0x80, 0xff],
  A: [0x7e, 0x81, 0x81, 0xff, 0x81, 0x81, 0x81],
  P: [0xfe, 0x81, 0x81, 0xfe, 0x80, 0x80, 0x80],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};

export function ScifiLogo({ text = "SKETCH2APP", size = "md", showIcon = true, className = "" }: ScifiLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dimensions = {
    sm: { pixelSize: 2, spacing: 1, width: 200, height: 20 },
    md: { pixelSize: 3, spacing: 1, width: 300, height: 25 },
    lg: { pixelSize: 4, spacing: 2, width: 400, height: 32 },
  }[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render dot matrix text
    let xOffset = 0;
    const chars = text.toUpperCase().split("");

    chars.forEach((char) => {
      const pattern = FONT_5X7[char] || FONT_5X7[" "];

      pattern.forEach((row, y) => {
        for (let x = 0; x < 8; x++) {
          if (row & (1 << (7 - x))) {
            ctx.fillStyle = "var(--scifi-cyan)";
            ctx.fillRect(
              xOffset + x * (dimensions.pixelSize + dimensions.spacing),
              y * (dimensions.pixelSize + dimensions.spacing),
              dimensions.pixelSize,
              dimensions.pixelSize
            );
          }
        }
      });

      xOffset += 8 * (dimensions.pixelSize + dimensions.spacing) + dimensions.pixelSize * 2;
    });
  }, [text, dimensions]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className="relative" style={{ width: size === "sm" ? "24px" : size === "md" ? "32px" : "40px", height: size === "sm" ? "24px" : size === "md" ? "32px" : "40px" }}>
          {/* Hex icon with double ring */}
          <svg viewBox="0 0 40 40" className="w-full h-full">
            {/* Outer ring */}
            <polygon
              points="20,2 35,11 35,29 20,38 5,29 5,11"
              fill="none"
              stroke="var(--scifi-orange)"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 6px var(--scifi-orange))" }}
            />
            {/* Inner ring */}
            <polygon
              points="20,6 31,13 31,27 20,34 9,27 9,13"
              fill="none"
              stroke="var(--scifi-cyan)"
              strokeWidth="1"
              style={{ filter: "drop-shadow(0 0 4px var(--scifi-cyan))" }}
            />
            {/* HUD ticks */}
            <line x1="20" y1="0" x2="20" y2="4" stroke="var(--scifi-green)" strokeWidth="1" />
            <line x1="38" y1="20" x2="34" y2="20" stroke="var(--scifi-green)" strokeWidth="1" />
            <line x1="20" y1="40" x2="20" y2="36" stroke="var(--scifi-green)" strokeWidth="1" />
            <line x1="2" y1="20" x2="6" y2="20" stroke="var(--scifi-green)" strokeWidth="1" />
          </svg>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
