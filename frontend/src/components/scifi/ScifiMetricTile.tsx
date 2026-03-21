import { ReactNode } from "react";

interface ScifiMetricTileProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "cyan" | "orange" | "green";
  className?: string;
}

export function ScifiMetricTile({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = "cyan",
  className = "",
}: ScifiMetricTileProps) {
  const accentColor = {
    cyan: "var(--scifi-cyan)",
    orange: "var(--scifi-orange)",
    green: "var(--scifi-green)",
  }[variant];

  const trendColor = trend === "up" ? "var(--scifi-green)" : trend === "down" ? "#dc2626" : "var(--scifi-text-dim)";

  return (
    <div
      className={`relative p-4 ${className}`}
      style={{
        backgroundColor: "var(--scifi-panel)",
        border: `1px solid ${accentColor}`,
        clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        boxShadow: `0 0 16px ${accentColor}20, inset 0 0 16px ${accentColor}08`,
      }}
    >
      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-2">
        {/* Label with icon */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs uppercase tracking-wider"
            style={{
              color: "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace",
              fontWeight: "600",
            }}
          >
            {label}
          </span>
          {icon && (
            <div
              style={{
                color: accentColor,
                filter: `drop-shadow(0 0 4px ${accentColor})`,
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div
          className="text-3xl font-bold tabular-nums"
          style={{
            color: accentColor,
            fontFamily: "'Courier New', monospace",
            textShadow: `0 0 8px ${accentColor}80`,
          }}
        >
          {value}
        </div>

        {/* Trend */}
        {trend && trendValue && (
          <div className="flex items-center gap-1.5">
            <span
              style={{
                color: trendColor,
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "●"} {trendValue}
            </span>
          </div>
        )}
      </div>

      {/* Bottom border accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
          boxShadow: `0 0 8px ${accentColor}`,
        }}
      />
    </div>
  );
}
