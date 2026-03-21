interface ScifiProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: "cyan" | "orange" | "green";
  showValue?: boolean;
  className?: string;
}

export function ScifiProgressBar({ value, label, color = "cyan", showValue = true, className = "" }: ScifiProgressBarProps) {
  const barColor = {
    cyan: "var(--scifi-cyan)",
    orange: "var(--scifi-orange)",
    green: "var(--scifi-green)",
  }[color];

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
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
          )}
          {showValue && (
            <span
              className="text-xs tabular-nums"
              style={{
                color: barColor,
                fontFamily: "'Courier New', monospace",
                fontWeight: "600",
              }}
            >
              {clampedValue.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "4px",
          backgroundColor: "var(--scifi-panel)",
          border: `1px solid ${barColor}40`,
        }}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}, inset 0 0 4px ${barColor}`,
          }}
        />

        {/* Bright tip indicator */}
        {clampedValue > 0 && clampedValue < 100 && (
          <div
            className="absolute top-0 h-full w-1 transition-all duration-300 ease-out"
            style={{
              left: `${clampedValue}%`,
              backgroundColor: barColor,
              boxShadow: `0 0 12px ${barColor}, 0 0 6px ${barColor}`,
              transform: "translateX(-50%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
