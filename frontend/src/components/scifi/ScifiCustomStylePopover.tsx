import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface CustomStyle {
  name: string;
  description: string;
}

interface ScifiCustomStylePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: CustomStyle) => void;
  anchorEl?: HTMLElement | null;
}

export function ScifiCustomStylePopover({ isOpen, onClose, onSave, anchorEl }: ScifiCustomStylePopoverProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: "bottom" });

  // Calculate position based on anchor element
  useEffect(() => {
    if (isOpen && anchorEl && popoverRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverHeight = 240; // Approximate height
      const popoverWidth = 280;

      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      let top = anchorRect.bottom + 8; // 8px gap
      let placement = "bottom";

      // If not enough space below, show above
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        top = anchorRect.top - popoverHeight - 8;
        placement = "top";
      }

      // Center horizontally relative to anchor
      let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

      // Ensure it doesn't overflow viewport
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }

      setPosition({ top, left, placement });
    }
  }, [isOpen, anchorEl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !anchorEl?.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name && description) {
      onSave({ name, description });
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: "280px",
        backgroundColor: "var(--scifi-panel)",
        border: "1px solid var(--scifi-green)",
        clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        boxShadow: "0 0 20px var(--scifi-green)40, inset 0 0 16px var(--scifi-green)08",
        padding: "1rem",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}
        >
          NEW STYLE
        </span>
        <button onClick={onClose} style={{ color: "var(--scifi-text-dim)", cursor: "pointer" }}>
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            backgroundColor: "var(--scifi-bg)",
            border: "none",
            borderBottom: "1px solid var(--scifi-green)",
            color: "var(--scifi-text)",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.75rem",
            padding: "0.5rem 0.25rem",
            outline: "none",
          }}
        />
        <textarea
          placeholder="Guidelines (e.g., colors, layout, effects)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            backgroundColor: "var(--scifi-bg)",
            border: "1px solid var(--scifi-green)",
            color: "var(--scifi-text)",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.75rem",
            padding: "0.5rem",
            outline: "none",
            resize: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!name || !description}
          style={{
            width: "100%",
            height: "28px",
            clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
            backgroundColor: name && description ? "var(--scifi-green)" : "rgba(57, 255, 20, 0.2)",
            border: "1px solid var(--scifi-green)",
            color: name && description ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.7rem",
            fontWeight: "600",
            cursor: name && description ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
          }}
        >
          <Plus className="w-3 h-3" />
          CREATE
        </button>
      </div>
    </div>
  );
}
