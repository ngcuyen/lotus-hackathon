import { useState, useEffect, useCallback } from "react";
import { Settings, Palette, Sliders, Sparkles, Layers, RotateCcw } from "lucide-react";
import { getPanelSettings, savePanelSettings, resetPanelSettings, type PanelSettings } from "../api/settings";

export type CustomizationSettings = PanelSettings;

interface PanelCustomizerProps {
  onApply: (settings: CustomizationSettings) => void;
}

const DEFAULTS: CustomizationSettings = {
  panelOpacity: 75,
  panelBlur: 12,
  borderGlow: true,
  animationSpeed: "normal",
  colorScheme: "cyan",
  fontSize: "medium",
  spacing: "normal",
};

export function PanelCustomizer({ onApply }: PanelCustomizerProps) {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    getPanelSettings()
      .then((res) => {
        setSettings(res.settings as CustomizationSettings);
        onApply(res.settings as CustomizationSettings);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(<K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = async () => {
    onApply(settings);
    setSaving(true);
    try {
      await savePanelSettings(settings);
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSettings(DEFAULTS);
    onApply(DEFAULTS);
    try {
      await resetPanelSettings();
    } catch (e) {
      console.warn("Failed to reset settings:", e);
    }
  };

  if (!loaded) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" style={{ color: "var(--scifi-cyan)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}>
              SETTINGS
            </span>
          </div>
          <button
            onClick={handleReset}
            title="Reset to defaults"
            style={{
              width: "28px", height: "28px",
              backgroundColor: "transparent", border: "1px solid var(--scifi-orange)", color: "var(--scifi-orange)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
            }}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Panel Opacity */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
              <Layers className="w-3 h-3" />
              PANEL OPACITY ({settings.panelOpacity}%)
            </label>
            <input type="range" min="0" max="100" value={settings.panelOpacity} onChange={(e) => update("panelOpacity", parseInt(e.target.value))} style={{ width: "100%", accentColor: "var(--scifi-cyan)" }} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>Transparent</span>
              <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>Opaque</span>
            </div>
          </div>

          {/* Panel Blur */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
              <Sparkles className="w-3 h-3" />
              BACKGROUND BLUR ({settings.panelBlur}px)
            </label>
            <input type="range" min="0" max="24" value={settings.panelBlur} onChange={(e) => update("panelBlur", parseInt(e.target.value))} style={{ width: "100%", accentColor: "var(--scifi-cyan)" }} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>No Blur</span>
              <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>Max Blur</span>
            </div>
          </div>

          {/* Border Glow */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>BORDER GLOW</label>
            <button onClick={() => update("borderGlow", !settings.borderGlow)} style={{
              width: "100%", height: "32px",
              clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              backgroundColor: settings.borderGlow ? "var(--scifi-cyan)" : "transparent",
              border: "1px solid var(--scifi-cyan)",
              color: settings.borderGlow ? "var(--scifi-bg)" : "var(--scifi-cyan)",
              fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
            }}>
              {settings.borderGlow ? "ENABLED" : "DISABLED"}
            </button>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
              <Palette className="w-3 h-3" />
              COLOR SCHEME
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "cyan", label: "CYAN", color: "#00d4ff" },
                { id: "orange", label: "ORANGE", color: "#ff6a00" },
                { id: "purple", label: "PURPLE", color: "#7b3fff" },
                { id: "green", label: "GREEN", color: "#39ff14" },
              ] as const).map((s) => (
                <button key={s.id} onClick={() => update("colorScheme", s.id)} style={{
                  height: "32px",
                  clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                  backgroundColor: settings.colorScheme === s.id ? s.color : "transparent",
                  border: `1px solid ${s.color}`, color: settings.colorScheme === s.id ? "var(--scifi-bg)" : s.color,
                  fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Animation Speed */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
              <Sliders className="w-3 h-3" />
              ANIMATION SPEED
            </label>
            <div className="flex gap-1">
              {(["slow", "normal", "fast"] as const).map((v) => (
                <button key={v} onClick={() => update("animationSpeed", v)} style={{
                  flex: 1, height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: settings.animationSpeed === v ? "var(--scifi-cyan)" : "transparent",
                  border: "1px solid var(--scifi-cyan)", color: settings.animationSpeed === v ? "var(--scifi-bg)" : "var(--scifi-cyan)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer", textTransform: "uppercase",
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>FONT SIZE</label>
            <div className="flex gap-1">
              {(["small", "medium", "large"] as const).map((v) => (
                <button key={v} onClick={() => update("fontSize", v)} style={{
                  flex: 1, height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: settings.fontSize === v ? "var(--scifi-cyan)" : "transparent",
                  border: "1px solid var(--scifi-cyan)", color: settings.fontSize === v ? "var(--scifi-bg)" : "var(--scifi-cyan)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer", textTransform: "uppercase",
                }}>{v[0]}</button>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>SPACING</label>
            <div className="flex gap-1">
              {(["compact", "normal", "spacious"] as const).map((v) => (
                <button key={v} onClick={() => update("spacing", v)} style={{
                  flex: 1, height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: settings.spacing === v ? "var(--scifi-cyan)" : "transparent",
                  border: "1px solid var(--scifi-cyan)", color: settings.spacing === v ? "var(--scifi-bg)" : "var(--scifi-cyan)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer", textTransform: "uppercase",
                }}>{v[0]}</button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={saving}
            style={{
              width: "100%", height: "36px",
              clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
              backgroundColor: "var(--scifi-green)", border: "1px solid var(--scifi-green)", color: "var(--scifi-bg)",
              fontFamily: "'Courier New', monospace", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
              boxShadow: "0 0 16px var(--scifi-green)80", transition: "all 0.2s",
              opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 24px var(--scifi-green)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 16px var(--scifi-green)80"; }}
          >
            {saving ? "SAVING..." : "APPLY & SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
