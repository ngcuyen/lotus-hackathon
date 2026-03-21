import { useState, useRef, useEffect } from "react";
import { Move } from "lucide-react";

interface DraggableOverlayProps {
  previewRef: React.RefObject<HTMLIFrameElement>;
  onPositionChange: (deltaX: number, deltaY: number) => void;
  onDragEnd: (deltaX: number, deltaY: number) => void;
}

export function DraggableOverlay({ previewRef, onPositionChange, onDragEnd }: DraggableOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [overlay, setOverlay] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(null);
  const totalDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const iframe = previewRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Skip if clicking on html/body
      if (target.tagName === "HTML" || target.tagName === "BODY") {
        setSelectedElement(null);
        setOverlay(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setSelectedElement(target);

      const rect = target.getBoundingClientRect();
      setOverlay({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      totalDelta.current = { x: 0, y: 0 };
    };

    iframeDoc.addEventListener("click", handleClick, true);
    return () => iframeDoc.removeEventListener("click", handleClick, true);
  }, [previewRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedElement || !overlay) return;

    e.preventDefault();
    setIsDragging(true);

    const computedStyle = window.getComputedStyle(selectedElement);
    const currentLeft = parseFloat(computedStyle.left) || 0;
    const currentTop = parseFloat(computedStyle.top) || 0;

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: currentLeft,
      elementY: currentTop,
    };

    // Ensure element is positioned
    if (computedStyle.position === "static") {
      selectedElement.style.position = "relative";
    }
  };

  useEffect(() => {
    if (!isDragging || !selectedElement || !dragStart.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current!.x;
      const deltaY = e.clientY - dragStart.current!.y;

      // Update element position
      selectedElement.style.left = `${dragStart.current!.elementX + deltaX}px`;
      selectedElement.style.top = `${dragStart.current!.elementY + deltaY}px`;

      // Update overlay position
      const rect = selectedElement.getBoundingClientRect();
      setOverlay({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      totalDelta.current = { x: deltaX, y: deltaY };
      onPositionChange(deltaX, deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd(totalDelta.current.x, totalDelta.current.y);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedElement, onPositionChange, onDragEnd]);

  if (!overlay) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: overlay.top,
        left: overlay.left,
        width: overlay.width,
        height: overlay.height,
        border: "2px solid var(--scifi-cyan)",
        backgroundColor: isDragging ? "rgba(0, 212, 255, 0.1)" : "rgba(0, 212, 255, 0.05)",
        pointerEvents: "auto",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: 9999,
        transition: isDragging ? "none" : "all 0.2s",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle */}
      <div
        style={{
          position: "absolute",
          top: -24,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          backgroundColor: "var(--scifi-cyan)",
          color: "black",
          fontSize: "10px",
          fontFamily: "'Courier New', monospace",
          fontWeight: "bold",
        }}
      >
        <Move className="w-3 h-3" />
        {selectedElement?.tagName.toLowerCase()}
        {isDragging && (
          <span style={{ marginLeft: "8px", opacity: 0.7 }}>
            ({totalDelta.current.x > 0 ? "+" : ""}{Math.round(totalDelta.current.x)}px,
            {totalDelta.current.y > 0 ? "+" : ""}{Math.round(totalDelta.current.y)}px)
          </span>
        )}
      </div>

      {/* Corner resize handles (for future enhancement) */}
      <div
        style={{
          position: "absolute",
          top: -4,
          left: -4,
          width: 8,
          height: 8,
          backgroundColor: "var(--scifi-cyan)",
          cursor: "nw-resize",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 8,
          height: 8,
          backgroundColor: "var(--scifi-cyan)",
          cursor: "ne-resize",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -4,
          left: -4,
          width: 8,
          height: 8,
          backgroundColor: "var(--scifi-cyan)",
          cursor: "sw-resize",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -4,
          right: -4,
          width: 8,
          height: 8,
          backgroundColor: "var(--scifi-cyan)",
          cursor: "se-resize",
        }}
      />
    </div>
  );
}
