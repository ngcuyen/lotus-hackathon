import { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface ScifiNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ScifiNav({ items, activeId, onSelect, className = "" }: ScifiNavProps) {
  return (
    <nav className={`flex items-center gap-2 ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="relative"
            style={{
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
              backgroundColor: isActive ? "var(--scifi-panel)" : "transparent",
              border: `1px solid ${isActive ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.3)"}`,
              boxShadow: isActive ? "0 0 16px var(--scifi-orange)60" : "none",
              padding: "0.625rem 1.25rem",
              color: isActive ? "var(--scifi-orange)" : "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.875rem",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "var(--scifi-orange)";
                e.currentTarget.style.color = "var(--scifi-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.3)";
                e.currentTarget.style.color = "var(--scifi-text-dim)";
              }
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </div>
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-3 h-0.5"
                style={{
                  backgroundColor: "var(--scifi-orange)",
                  boxShadow: "0 0 8px var(--scifi-orange)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
