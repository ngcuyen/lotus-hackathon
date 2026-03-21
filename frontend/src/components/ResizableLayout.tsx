import { ReactNode, useState, useRef, useEffect } from "react";

interface ResizableLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function ResizableLayout({ leftPanel, centerPanel, rightPanel }: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(500); // Main content width
  const [rightWidth, setRightWidth] = useState(320); // Settings panel width
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Handle left resize (between settings and main content)
  useEffect(() => {
    if (!isDraggingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Min 200px, max 40% of screen
      const minWidth = 200;
      const maxWidth = containerRect.width * 0.4;
      setLeftWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft]);

  // Handle right resize (between main content and preview)
  useEffect(() => {
    if (!isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      // Min 280px, max 500px (Settings panel)
      const minWidth = 280;
      const maxWidth = 500;
      setRightWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingRight]);

  return (
    <div ref={containerRef} className="flex h-screen w-full relative">
      {/* Left Panel - Settings */}
      <div
        style={{
          width: `${leftWidth}px`,
          minWidth: "200px",
          maxWidth: "40%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {leftPanel}
      </div>

      {/* Left Resize Handle */}
      <div
        onMouseDown={() => setIsDraggingLeft(true)}
        style={{
          width: "4px",
          height: "100%",
          backgroundColor: isDraggingLeft ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.2)",
          cursor: "col-resize",
          transition: isDraggingLeft ? "none" : "background-color 0.2s",
          position: "relative",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDraggingLeft) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDraggingLeft) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
          }
        }}
      >
        {/* Visual indicator */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "60px",
            backgroundColor: isDraggingLeft ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.3)",
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

      {/* Center Panel - Main Content */}
      <div
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          minWidth: "300px",
        }}
      >
        {centerPanel}
      </div>

      {/* Right Resize Handle */}
      <div
        onMouseDown={() => setIsDraggingRight(true)}
        style={{
          width: "4px",
          height: "100%",
          backgroundColor: isDraggingRight ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.2)",
          cursor: "col-resize",
          transition: isDraggingRight ? "none" : "background-color 0.2s",
          position: "relative",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDraggingRight) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDraggingRight) {
            e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
          }
        }}
      >
        {/* Visual indicator */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px",
            height: "60px",
            backgroundColor: isDraggingRight ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.3)",
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

      {/* Right Panel - Settings */}
      <div
        style={{
          width: `${rightWidth}px`,
          minWidth: "280px",
          maxWidth: "500px",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
