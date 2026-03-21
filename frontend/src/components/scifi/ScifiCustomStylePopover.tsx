import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

interface CustomStyle {
  name: string;
  description: string;
  guidelines: string;
}

interface ScifiCustomStylePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: CustomStyle) => void;
  anchorEl?: HTMLElement | null;
}

const PRESETS = [
  { label: "Cyberpunk", guidelines: "Neon colors (#ff00ff, #00ffff) on dark bg (#0a0a0a), glitch effects, sharp angles, monospace fonts, glowing borders" },
  { label: "Pastel", guidelines: "Soft pastel colors (pink-200, blue-200, yellow-100), rounded-3xl, gentle shadows, playful fonts, light backgrounds" },
  { label: "Retro", guidelines: "Warm earth tones (#d4a574, #8b6914), serif fonts, paper textures, vintage borders, sepia-toned accents" },
];

export function ScifiCustomStylePopover({ isOpen, onClose, onSave, anchorEl }: ScifiCustomStylePopoverProps) {
  const [name, setName] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && !anchorEl?.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name && guidelines) {
      onSave({ name, description: guidelines, guidelines });
      setName("");
      setGuidelines("");
      onClose();
    }
  };

  // Calculate position from anchor
  const anchorRect = anchorEl?.getBoundingClientRect();
  const top = anchorRect ? anchorRect.bottom + 8 : 60;
  const right = anchorRect ? window.innerWidth - anchorRect.right : 16;

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onClick={onClose} />

      {/* Popover */}
      <div
        ref={popoverRef}
        style={{
          position: "fixed",
          zIndex: 99999,
          top: `${top}px`,
          right: `${right}px`,
          width: "320px",
          backgroundColor: "rgba(10, 15, 26, 0.98)",
          border: "1px solid var(--scifi-green)",
          clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
          boxShadow: "0 0 30px var(--scifi-green)40, 0 20px 40px rgba(0,0,0,0.5)",
          padding: "1rem",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}>
            NEW CUSTOM STYLE
          </span>
          <button onClick={onClose} style={{ color: "var(--scifi-text-dim)", cursor: "pointer", background: "none", border: "none" }}>
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              STYLE NAME
            </label>
            <input
              type="text"
              placeholder="e.g., Cyberpunk Neon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: "100%", height: "32px",
                backgroundColor: "var(--scifi-bg)", border: "none",
                borderBottom: "2px solid var(--scifi-green)",
                color: "var(--scifi-text)", fontFamily: "'Courier New', monospace", fontSize: "0.75rem",
                padding: "0 0.5rem", outline: "none",
              }}
            />
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              QUICK PRESETS
            </label>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setName(name || p.label); setGuidelines(p.guidelines); }}
                  style={{
                    flex: 1, height: "24px",
                    clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                    backgroundColor: "transparent", border: "1px solid rgba(57, 255, 20, 0.3)",
                    color: "var(--scifi-green)", fontFamily: "'Courier New', monospace", fontSize: "0.6rem", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(57, 255, 20, 0.1)"; e.currentTarget.style.borderColor = "var(--scifi-green)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "rgba(57, 255, 20, 0.3)"; }}
                >
                  {p.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              DESIGN GUIDELINES
            </label>
            <textarea
              placeholder={"Describe colors, shapes, effects, fonts...\nAI will use this to style the generated UI."}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "var(--scifi-bg)", border: "1px solid rgba(57, 255, 20, 0.3)",
                color: "var(--scifi-text)", fontFamily: "'Courier New', monospace", fontSize: "0.7rem",
                padding: "0.5rem", outline: "none", resize: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--scifi-green)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(57, 255, 20, 0.3)"; }}
            />
          </div>

          {/* Create button */}
          <button
            onClick={handleSubmit}
            disabled={!name || !guidelines}
            style={{
              width: "100%", height: "32px",
              clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              backgroundColor: name && guidelines ? "var(--scifi-green)" : "rgba(57, 255, 20, 0.15)",
              border: "1px solid var(--scifi-green)",
              color: name && guidelines ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "700",
              cursor: name && guidelines ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
              boxShadow: name && guidelines ? "0 0 12px var(--scifi-green)60" : "none",
              transition: "all 0.2s",
            }}
          >
            <Plus className="w-3 h-3" />
            CREATE STYLE
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
