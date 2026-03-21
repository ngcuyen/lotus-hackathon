import { ReactNode, useState, useRef, useEffect } from "react";

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel?: ReactNode;
  showRightPanel?: boolean;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, showRightPanel = false }: ThreePanelLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(500);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      const minWidth = 300;
      const maxWidth = containerRect.width * 0.4;
      setLeftWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* Left Panel - Input */}
      <div
        style={{
          width: `${leftWidth}px`,
          minWidth: "300px",
          maxWidth: "40%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {leftPanel}
      </div>

      {/* Left Resize Handle */}
      <div
        onMouseDown={() => setIsDragging(true)}
        style={{
          width: "4px",
          height: "100%",
          backgroundColor: isDragging ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.2)",
          cursor: "col-resize",
          transition: isDragging ? "none" : "background-color 0.2s",
          position: "relative",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
          }
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "60px",
            backgroundColor: isDragging ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.3)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "4px",
            transition: "background-color 0.2s",
          }}
        >
          <div style={{ width: "2px", height: "20px", backgroundColor: "var(--scifi-bg)" }} />
          <div style={{ width: "2px", height: "20px", backgroundColor: "var(--scifi-bg)" }} />
        </div>
      </div>

      {/* Center Panel - Preview */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          minWidth: "400px",
        }}
      >
        {centerPanel}
      </div>

      {/* Right Panel - Settings (conditional) */}
      {showRightPanel && rightPanel && (
        <div
          style={{
            width: "320px",
            minWidth: "320px",
            maxWidth: "320px",
            height: "100%",
            overflow: "hidden",
            borderLeft: "1px solid rgba(0, 212, 255, 0.2)",
            position: "relative",
            zIndex: 20,
          }}
        >
          {rightPanel}
        </div>
      )}
    </div>
  );
}
