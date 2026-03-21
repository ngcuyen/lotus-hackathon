import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface StyleOption {
  id: string;
  name: string;
  icon: ReactNode;
  description?: string;
  custom?: boolean;
}

interface ScifiStyleSelectorProps {
  options: StyleOption[];
  selected: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

function Tooltip({ text, anchorRect }: { text: string; anchorRect: DOMRect }) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        zIndex: 99999,
        top: anchorRect.bottom + 6,
        left: anchorRect.left + anchorRect.width / 2,
        transform: "translateX(-50%)",
        backgroundColor: "rgba(10, 15, 26, 0.95)",
        border: "1px solid var(--scifi-orange)",
        clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
        padding: "4px 10px",
        fontSize: "0.65rem",
        fontWeight: 600,
        color: "var(--scifi-orange)",
        fontFamily: "'Courier New', monospace",
        boxShadow: "0 0 12px var(--scifi-orange)40",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>,
    document.body
  );
}

export function ScifiStyleSelector({ options, selected, onSelect, onDelete, className = "" }: ScifiStyleSelectorProps) {
  const [hovered, setHovered] = useState<{ id: string; rect: DOMRect } | null>(null);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.id === selected;
        const isHovered = hovered?.id === option.id;
        return (
          <div key={option.id} style={{ position: "relative" }}>
            <button
              onClick={() => onSelect(option.id)}
              onMouseEnter={(e) => setHovered({ id: option.id, rect: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: "36px",
                height: "36px",
                clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
                backgroundColor: isActive ? "var(--scifi-panel)" : isHovered ? "rgba(17, 24, 39, 0.3)" : "transparent",
                border: `1px solid ${isActive ? "var(--scifi-orange)" : isHovered ? "rgba(255, 106, 0, 0.5)" : "rgba(255, 106, 0, 0.2)"}`,
                boxShadow: isActive ? "0 0 12px var(--scifi-orange)40" : "none",
                color: isActive || isHovered ? "var(--scifi-orange)" : "var(--scifi-text-dim)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {option.icon}
            </button>

            {/* Delete button for custom styles */}
            {option.custom && isHovered && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(option.id); setHovered(null); }}
                onMouseEnter={(e) => {
                  // Keep hovered state
                  const parent = e.currentTarget.previousElementSibling as HTMLElement;
                  if (parent) setHovered({ id: option.id, rect: parent.getBoundingClientRect() });
                }}
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "#dc2626",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 10,
                  boxShadow: "0 0 4px rgba(220, 38, 38, 0.5)",
                }}
              >
                <X style={{ width: "8px", height: "8px" }} />
              </button>
            )}

            {/* Active indicator */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-3px",
                  left: "50%",
                  width: "12px",
                  height: "2px",
                  backgroundColor: "var(--scifi-orange)",
                  boxShadow: "0 0 6px var(--scifi-orange)",
                  transform: "translateX(-50%)",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Portal tooltip */}
      {hovered && <Tooltip text={options.find(o => o.id === hovered.id)?.name || ""} anchorRect={hovered.rect} />}
    </div>
  );
}
