import { InputHTMLAttributes } from "react";

interface ScifiInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  accentColor?: "cyan" | "orange";
}

export function ScifiInput({ label, accentColor = "cyan", className = "", ...props }: ScifiInputProps) {
  const borderColor = accentColor === "cyan" ? "var(--scifi-cyan)" : "var(--scifi-orange)";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          className="text-xs uppercase tracking-wider"
          style={{
            color: "var(--scifi-text-dim)",
            fontFamily: "'Courier New', monospace",
            fontWeight: "600",
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className="scifi-input"
        style={{
          backgroundColor: "var(--scifi-panel)",
          border: "none",
          borderBottom: `2px solid ${borderColor}`,
          color: "var(--scifi-text)",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.875rem",
          padding: "0.75rem 0.5rem",
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: `0 4px 8px ${borderColor}20`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 12px ${borderColor}60`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 8px ${borderColor}20`;
        }}
      />
    </div>
  );
}
