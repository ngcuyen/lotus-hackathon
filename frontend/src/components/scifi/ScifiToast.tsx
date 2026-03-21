import { ReactNode, useEffect, useState } from "react";

type ToastType = "info" | "success" | "warning" | "error";

interface ScifiToastProps {
  message: string;
  type?: ToastType;
  icon?: ReactNode;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function ScifiToast({ message, type = "info", icon, duration = 3000, onClose, className = "" }: ScifiToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getStyles = () => {
    const baseColor = {
      info: "var(--scifi-cyan)",
      success: "var(--scifi-green)",
      warning: "var(--scifi-orange)",
      error: "#dc2626",
    }[type];

    return {
      backgroundColor: "var(--scifi-panel)",
      border: `1px solid ${baseColor}`,
      color: baseColor,
      boxShadow: `0 0 24px ${baseColor}60, inset 0 0 12px ${baseColor}10`,
      baseColor,
    };
  };

  if (!isVisible) return null;

  const styles = getStyles();

  return (
    <div
      className={`relative ${className}`}
      style={{
        ...styles,
        clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",
        padding: "1rem 1.5rem",
        minWidth: "300px",
        maxWidth: "500px",
        fontFamily: "'Courier New', monospace",
        transform: isExiting ? "translateX(400px)" : "translateX(0)",
        opacity: isExiting ? 0 : 1,
        transition: "all 0.3s ease-out",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${styles.baseColor} 50%, transparent 100%)`,
          boxShadow: `0 0 8px ${styles.baseColor}`,
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              style={{
                color: styles.baseColor,
                filter: `drop-shadow(0 0 6px ${styles.baseColor})`,
              }}
            >
              {icon}
            </div>
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>

        <button
          onClick={handleClose}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: styles.baseColor }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
