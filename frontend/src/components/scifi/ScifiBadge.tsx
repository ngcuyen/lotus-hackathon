import { ReactNode } from "react";

type BadgeVariant = "active" | "processing" | "warning" | "offline";

interface ScifiBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  showPulse?: boolean;
  className?: string;
}

export function ScifiBadge({ children, variant = "active", showPulse = true, className = "" }: ScifiBadgeProps) {
  const getStyles = () => {
    const base = {
      clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
      padding: "0.375rem 0.875rem",
      fontSize: "0.75rem",
      fontFamily: "'Courier New', monospace",
      fontWeight: "600",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
    };

    switch (variant) {
      case "active":
        return {
          ...base,
          backgroundColor: "rgba(0, 212, 255, 0.15)",
          color: "var(--scifi-cyan)",
          border: "1px solid var(--scifi-cyan)",
          dotColor: "var(--scifi-cyan)",
        };
      case "processing":
        return {
          ...base,
          backgroundColor: "rgba(255, 106, 0, 0.15)",
          color: "var(--scifi-orange)",
          border: "1px solid var(--scifi-orange)",
          dotColor: "var(--scifi-orange)",
        };
      case "warning":
        return {
          ...base,
          backgroundColor: "rgba(57, 255, 20, 0.15)",
          color: "var(--scifi-green)",
          border: "1px solid var(--scifi-green)",
          dotColor: "var(--scifi-green)",
        };
      case "offline":
        return {
          ...base,
          backgroundColor: "rgba(156, 163, 175, 0.15)",
          color: "var(--scifi-text-dim)",
          border: "1px solid var(--scifi-text-dim)",
          dotColor: "var(--scifi-text-dim)",
        };
      default:
        return { ...base, dotColor: "var(--scifi-cyan)" };
    }
  };

  const styles = getStyles();
  const { dotColor, ...badgeStyles } = styles;

  return (
    <span className={className} style={badgeStyles}>
      {showPulse && (
        <span
          className="relative flex h-2 w-2"
          style={{
            animation: variant === "processing" ? "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
          }}
        >
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              backgroundColor: dotColor,
              animation: variant === "processing" ? "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
            }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{
              backgroundColor: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
            }}
          />
        </span>
      )}
      {children}
    </span>
  );
}

// Add ping animation to CSS if not present
const style = document.createElement("style");
style.textContent = `
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
`;
if (!document.querySelector('style[data-scifi-animations]')) {
  style.setAttribute('data-scifi-animations', 'true');
  document.head.appendChild(style);
}
