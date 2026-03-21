import { ReactNode } from "react";

interface StyleOption {
  id: string;
  name: string;
  icon: ReactNode;
  description?: string;
}

interface ScifiStyleSelectorProps {
  options: StyleOption[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ScifiStyleSelector({ options, selected, onSelect, className = "" }: ScifiStyleSelectorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.id === selected;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            title={option.description || option.name}
            className="group relative"
            style={{
              width: "36px",
              height: "36px",
              clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
              backgroundColor: isActive ? "var(--scifi-panel)" : "transparent",
              border: `1px solid ${isActive ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.2)"}`,
              boxShadow: isActive ? "0 0 12px var(--scifi-orange)40" : "none",
              color: isActive ? "var(--scifi-orange)" : "var(--scifi-text-dim)",
              transition: "all 0.2s ease",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.5)";
                e.currentTarget.style.color = "var(--scifi-orange)";
                e.currentTarget.style.backgroundColor = "rgba(17, 24, 39, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.2)";
                e.currentTarget.style.color = "var(--scifi-text-dim)";
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {option.icon}

            {/* Tooltip */}
            <div
              className="absolute top-full mt-2 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
              style={{
                backgroundColor: "var(--scifi-panel)",
                border: "1px solid var(--scifi-orange)",
                clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                fontSize: "0.75rem",
                color: "var(--scifi-text)",
                fontFamily: "'Courier New', monospace",
                boxShadow: "0 0 16px var(--scifi-orange)40",
              }}
            >
              {option.name}
            </div>

            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute -bottom-1 left-1/2 w-3 h-0.5"
                style={{
                  backgroundColor: "var(--scifi-orange)",
                  boxShadow: "0 0 6px var(--scifi-orange)",
                  transform: "translateX(-50%)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
