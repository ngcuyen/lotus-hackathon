import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "filled-cyan" | "filled-orange" | "outline-cyan" | "outline-orange" | "danger" | "ghost" | "cta";

interface ScifiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function ScifiButton({ children, variant = "filled-cyan", className = "", ...props }: ScifiButtonProps) {
  const getStyles = () => {
    const base = {
      clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
      transition: "all 0.2s ease",
      fontFamily: "'Courier New', monospace",
      fontSize: "0.875rem",
      fontWeight: "600",
      padding: "0.75rem 1.5rem",
      border: "1px solid transparent",
      cursor: "pointer",
      position: "relative" as const,
      display: "flex",
      boxShadow: "none",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    };

    switch (variant) {
      case "filled-cyan":
        return {
          ...base,
          backgroundColor: "var(--scifi-cyan)",
          color: "var(--scifi-bg)",
          boxShadow: "0 0 16px var(--scifi-cyan)80",
          border: "1px solid var(--scifi-cyan)",
        };
      case "filled-orange":
        return {
          ...base,
          backgroundColor: "var(--scifi-orange)",
          color: "var(--scifi-bg)",
          boxShadow: "0 0 16px var(--scifi-orange)80",
          border: "1px solid var(--scifi-orange)",
        };
      case "outline-cyan":
        return {
          ...base,
          backgroundColor: "transparent",
          color: "var(--scifi-cyan)",
          boxShadow: "0 0 12px var(--scifi-cyan)40",
          border: "1px solid var(--scifi-cyan)",
        };
      case "outline-orange":
        return {
          ...base,
          backgroundColor: "transparent",
          color: "var(--scifi-orange)",
          boxShadow: "0 0 12px var(--scifi-orange)40",
          border: "1px solid var(--scifi-orange)",
        };
      case "danger":
        return {
          ...base,
          backgroundColor: "#dc2626",
          color: "#fff",
          boxShadow: "0 0 16px #dc262680",
          border: "1px solid #dc2626",
        };
      case "ghost":
        return {
          ...base,
          backgroundColor: "transparent",
          color: "var(--scifi-text)",
          boxShadow: "none",
          border: "1px solid transparent",
        };
      case "cta":
        return {
          ...base,
          backgroundColor: "var(--scifi-green)",
          color: "var(--scifi-bg)",
          boxShadow: "0 0 20px var(--scifi-green)80",
          border: "1px solid var(--scifi-green)",
        };
      default:
        return base;
    }
  };

  return (
    <button
      {...props}
      className={`scifi-button ${className}`}
      style={getStyles()}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (variant === "filled-cyan") {
          e.currentTarget.style.boxShadow = "0 0 24px var(--scifi-cyan)";
        } else if (variant === "filled-orange") {
          e.currentTarget.style.boxShadow = "0 0 24px var(--scifi-orange)";
        } else if (variant === "cta") {
          e.currentTarget.style.boxShadow = "0 0 28px var(--scifi-green)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        const styles = getStyles();
        e.currentTarget.style.boxShadow = styles.boxShadow || "";
      }}
    >
      {children}
    </button>
  );
}
