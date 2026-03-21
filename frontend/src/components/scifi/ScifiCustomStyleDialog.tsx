import { useState } from "react";
import { X, Plus } from "lucide-react";
import { ScifiPanel } from "./ScifiPanel";
import { ScifiInput } from "./ScifiInput";
import { ScifiButton } from "./ScifiButton";

interface CustomStyle {
  name: string;
  description: string;
  colorPalette: string;
  cardStyle: string;
  buttonStyle: string;
  effectsStyle: string;
}

interface ScifiCustomStyleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: CustomStyle) => void;
}

export function ScifiCustomStyleDialog({ isOpen, onClose, onSave }: ScifiCustomStyleDialogProps) {
  const [formData, setFormData] = useState<CustomStyle>({
    name: "",
    description: "",
    colorPalette: "Primary: #00d4ff, Accent: #ff6a00",
    cardStyle: "Rounded corners, subtle shadow",
    buttonStyle: "Filled with glow effect",
    effectsStyle: "Hover animations, transitions",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (formData.name && formData.description) {
      onSave(formData);
      onClose();
      setFormData({
        name: "",
        description: "",
        colorPalette: "Primary: #00d4ff, Accent: #ff6a00",
        cardStyle: "Rounded corners, subtle shadow",
        buttonStyle: "Filled with glow effect",
        effectsStyle: "Hover animations, transitions",
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(10, 15, 26, 0.8)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "100%" }}>
        <ScifiPanel variant="cyan" className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-bold uppercase tracking-wider"
              style={{
                color: "var(--scifi-cyan)",
                fontFamily: "'Courier New', monospace",
              }}
            >
              CREATE CUSTOM STYLE
            </h2>
            <button
              onClick={onClose}
              style={{
                color: "var(--scifi-text-dim)",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--scifi-cyan)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--scifi-text-dim)";
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <ScifiInput
              label="STYLE NAME"
              accentColor="cyan"
              placeholder="e.g., Cyberpunk 2077"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <ScifiInput
              label="DESCRIPTION"
              accentColor="cyan"
              placeholder="Brief description of your style"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label
                className="text-xs uppercase tracking-wider mb-1.5 block"
                style={{
                  color: "var(--scifi-text-dim)",
                  fontFamily: "'Courier New', monospace",
                  fontWeight: "600",
                }}
              >
                DESIGN GUIDELINES
              </label>
              <textarea
                value={`Color Palette: ${formData.colorPalette}\n\nCard Style: ${formData.cardStyle}\n\nButton Style: ${formData.buttonStyle}\n\nEffects: ${formData.effectsStyle}`}
                onChange={(e) => {
                  const lines = e.target.value.split("\n\n");
                  setFormData({
                    ...formData,
                    colorPalette: lines[0]?.replace("Color Palette: ", "") || "",
                    cardStyle: lines[1]?.replace("Card Style: ", "") || "",
                    buttonStyle: lines[2]?.replace("Button Style: ", "") || "",
                    effectsStyle: lines[3]?.replace("Effects: ", "") || "",
                  });
                }}
                rows={8}
                style={{
                  width: "100%",
                  backgroundColor: "var(--scifi-panel)",
                  border: "1px solid var(--scifi-cyan)",
                  borderBottom: "2px solid var(--scifi-cyan)",
                  color: "var(--scifi-text)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.875rem",
                  padding: "0.75rem",
                  outline: "none",
                  resize: "vertical",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 8px var(--scifi-cyan)20",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px var(--scifi-cyan)60";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 8px var(--scifi-cyan)20";
                }}
              />
            </div>

            <p className="text-xs" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              AI will use these guidelines to generate your custom UI style
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <ScifiButton variant="ghost" onClick={onClose}>
              CANCEL
            </ScifiButton>
            <ScifiButton variant="filled-cyan" onClick={handleSubmit} disabled={!formData.name || !formData.description}>
              <Plus className="w-4 h-4 inline mr-2" />
              CREATE STYLE
            </ScifiButton>
          </div>
        </ScifiPanel>
      </div>
    </div>
  );
}
