import { ReactNode } from "react";

interface ScifiPanelProps {
  children: ReactNode;
  variant?: "orange" | "cyan";
  className?: string;
}

export function ScifiPanel({ children, variant = "cyan", className = "" }: ScifiPanelProps) {
  const borderColor = variant === "orange" ? "rgba(255, 106, 0, 0.4)" : "rgba(0, 212, 255, 0.4)";

  return (
    <div
      className={`relative p-6 ${className}`}
      style={{
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "2px",
      }}
    >
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
