import { useState } from "react";
import { Trash2, Move, Type, Palette, Maximize2, Send, ChevronDown, ChevronRight, AlignLeft, AlignCenter, AlignRight, X } from "lucide-react";
import type { LivePreviewHandle } from "./LivePreview";

interface SelectedElement {
  tagName: string;
  className: string;
  textContent: string;
  rect: { top: number; left: number; width: number; height: number };
  computedStyle: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    padding: string;
    borderRadius: string;
  };
}

interface VisualEditorProps {
  selectedElement: SelectedElement | null;
  previewRef: React.RefObject<LivePreviewHandle | null>;
  onModify: (modification: string) => void;
  onClose: () => void;
}

export function VisualEditor({ selectedElement, previewRef, onModify, onClose }: VisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "advanced" | "custom">("quick");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedColor, setSelectedColor] = useState("#00d4ff");
  const [selectedBgColor, setSelectedBgColor] = useState("#ffffff");
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [newText, setNewText] = useState("");

  // Advanced
  const [paddingTop, setPaddingTop] = useState("0");
  const [paddingRight, setPaddingRight] = useState("0");
  const [paddingBottom, setPaddingBottom] = useState("0");
  const [paddingLeft, setPaddingLeft] = useState("0");
  const [marginTop, setMarginTop] = useState("0");
  const [marginRight, setMarginRight] = useState("0");
  const [marginBottom, setMarginBottom] = useState("0");
  const [marginLeft, setMarginLeft] = useState("0");
  const [borderRadius, setBorderRadius] = useState("0");
  const [fontSize, setFontSize] = useState("16");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold" | "bolder">("normal");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [opacity, setOpacity] = useState("100");
  const [borderWidth, setBorderWidth] = useState("0");
  const [borderColor, setBorderColor] = useState("#000000");
  const [shadowX, setShadowX] = useState("0");
  const [shadowY, setShadowY] = useState("4");
  const [shadowBlur, setShadowBlur] = useState("6");
  const [shadowColor, setShadowColor] = useState("#00000040");

  const [spacingOpen, setSpacingOpen] = useState(true);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);

  if (!selectedElement) return null;

  const el = selectedElement;
  const tag = el.tagName.toLowerCase();
  const apply = (styles: Record<string, string>) => previewRef.current?.applyStyle(styles);

  const handleCustomModification = () => {
    if (customPrompt) { onModify(customPrompt); setCustomPrompt(""); }
  };

  const applySpacing = () => {
    const s: Record<string, string> = {};
    if (paddingTop !== "0") s.paddingTop = paddingTop + "px";
    if (paddingRight !== "0") s.paddingRight = paddingRight + "px";
    if (paddingBottom !== "0") s.paddingBottom = paddingBottom + "px";
    if (paddingLeft !== "0") s.paddingLeft = paddingLeft + "px";
    if (marginTop !== "0") s.marginTop = marginTop + "px";
    if (marginRight !== "0") s.marginRight = marginRight + "px";
    if (marginBottom !== "0") s.marginBottom = marginBottom + "px";
    if (marginLeft !== "0") s.marginLeft = marginLeft + "px";
    if (Object.keys(s).length) apply(s);
  };

  const applyTypography = () => {
    const s: Record<string, string> = {};
    if (fontSize !== "16") s.fontSize = fontSize + "px";
    if (fontWeight !== "normal") s.fontWeight = fontWeight;
    if (textAlign !== "left") s.textAlign = textAlign;
    if (Object.keys(s).length) apply(s);
  };

  const applyLayout = () => {
    const s: Record<string, string> = {};
    if (width) s.width = width;
    if (height) s.height = height;
    if (borderRadius !== "0") s.borderRadius = borderRadius + "px";
    if (Object.keys(s).length) apply(s);
  };

  const applyEffects = () => {
    const s: Record<string, string> = {};
    if (opacity !== "100") s.opacity = String(parseInt(opacity) / 100);
    if (borderWidth !== "0") s.border = `${borderWidth}px solid ${borderColor}`;
    if (shadowBlur !== "0") s.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`;
    if (Object.keys(s).length) apply(s);
  };

  // Shared styles
  const labelStyle: React.CSSProperties = { color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontWeight: "600" };
  const inputStyle: React.CSSProperties = {
    height: "28px", backgroundColor: "var(--scifi-bg)", border: "1px solid rgba(255, 106, 0, 0.3)",
    color: "var(--scifi-text)", fontFamily: "'Courier New', monospace", fontSize: "0.7rem", padding: "0 0.5rem", outline: "none",
  };
  const btnClip = "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)";
  const btnClip4 = "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)";

  const ToggleBtn = ({ active, onClick, children, style: s }: any) => (
    <button onClick={onClick} style={{
      flex: 1, height: "28px", clipPath: btnClip,
      backgroundColor: active ? "var(--scifi-orange)" : "transparent",
      border: "1px solid var(--scifi-orange)",
      color: active ? "var(--scifi-bg)" : "var(--scifi-orange)",
      fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600",
      cursor: "pointer", textTransform: "uppercase",
      display: "flex", alignItems: "center", justifyContent: "center", ...s,
    }}>{children}</button>
  );

  const ApplyBtn = ({ onClick, children }: any) => (
    <button onClick={onClick} style={{
      width: "100%", height: "28px", clipPath: btnClip, marginTop: "0.5rem",
      backgroundColor: "var(--scifi-orange)", border: "1px solid var(--scifi-orange)",
      color: "var(--scifi-bg)", fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer",
    }}>{children}</button>
  );

  const Section = ({ title, isOpen, onToggle, children }: any) => (
    <div className="mb-3">
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        color: "var(--scifi-orange)", fontFamily: "'Courier New', monospace", fontSize: "0.7rem",
        fontWeight: "600", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", padding: "0.25rem 0",
      }}>
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );

  const NumInput = ({ label, value, onChange, unit = "px" }: any) => (
    <div>
      <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>{label}</label>
      <div className="flex gap-1">
        <input type="number" value={value} onChange={(e: any) => onChange(e.target.value)} min={0} max={500} style={{ ...inputStyle, flex: 1 }} />
        <span className="flex items-center justify-center" style={{ width: "32px", height: "28px", border: "1px solid rgba(255, 106, 0, 0.3)", color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontSize: "0.65rem" }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255, 106, 0, 0.2)" }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Move className="w-4 h-4" style={{ color: "var(--scifi-orange)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--scifi-orange)", fontFamily: "'Courier New', monospace" }}>
              EDIT ELEMENT
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
            {el.tagName}{el.className && `.${el.className.split(" ")[0]}`}
          </span>
        </div>
        <button onClick={onClose} style={{
          width: "28px", height: "28px", backgroundColor: "transparent",
          border: "1px solid var(--scifi-orange)", color: "var(--scifi-orange)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          clipPath: btnClip,
        }}>
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(["quick", "advanced", "custom"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, height: "26px", clipPath: btnClip,
            backgroundColor: activeTab === t ? "var(--scifi-orange)" : "transparent",
            border: "1px solid var(--scifi-orange)",
            color: activeTab === t ? "var(--scifi-bg)" : "var(--scifi-orange)",
            fontFamily: "'Courier New', monospace", fontSize: "0.65rem", fontWeight: "600", cursor: "pointer", textTransform: "uppercase",
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>

        {/* ── Quick Tab ── */}
        {activeTab === "quick" && (
          <div className="space-y-3">
            {/* Text Color */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={labelStyle}>
                <Type className="w-3 h-3" /> TEXT COLOR
              </label>
              <div className="flex gap-2">
                <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} style={{ width: "40px", height: "32px", border: "1px solid var(--scifi-orange)", cursor: "pointer" }} />
                <button onClick={() => apply({ color: selectedColor })} style={{
                  flex: 1, height: "32px", clipPath: btnClip4,
                  backgroundColor: "var(--scifi-orange)", border: "1px solid var(--scifi-orange)", color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer",
                }}>APPLY</button>
              </div>
            </div>

            {/* BG Color */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={labelStyle}>
                <Palette className="w-3 h-3" /> BG COLOR
              </label>
              <div className="flex gap-2">
                <input type="color" value={selectedBgColor} onChange={(e) => setSelectedBgColor(e.target.value)} style={{ width: "40px", height: "32px", border: "1px solid var(--scifi-orange)", cursor: "pointer" }} />
                <button onClick={() => apply({ backgroundColor: selectedBgColor })} style={{
                  flex: 1, height: "32px", clipPath: btnClip4,
                  backgroundColor: "var(--scifi-orange)", border: "1px solid var(--scifi-orange)", color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer",
                }}>APPLY</button>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={labelStyle}>
                <Maximize2 className="w-3 h-3" /> SIZE
              </label>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as const).map((s) => (
                  <ToggleBtn key={s} active={selectedSize === s} onClick={() => { setSelectedSize(s); apply({ fontSize: s === "small" ? "0.875rem" : s === "large" ? "1.25rem" : "1rem", padding: s === "small" ? "0.25rem 0.5rem" : s === "large" ? "0.75rem 1.5rem" : "0.5rem 1rem" }); }}>
                    {s[0]}
                  </ToggleBtn>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={labelStyle}>
                <Type className="w-3 h-3" /> TEXT
              </label>
              <div className="flex gap-2">
                <input type="text" placeholder={el.textContent.slice(0, 20) || "New text"} value={newText} onChange={(e) => setNewText(e.target.value)}
                  style={{ ...inputStyle, flex: 1, height: "32px", borderBottom: "2px solid var(--scifi-orange)", border: "none", borderBottomStyle: "solid", borderBottomWidth: "2px", borderBottomColor: "var(--scifi-orange)" }}
                />
                <button onClick={() => { if (newText) previewRef.current?.applyText(newText); }} disabled={!newText} style={{
                  width: "60px", height: "32px", clipPath: btnClip4,
                  backgroundColor: newText ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.3)",
                  border: "1px solid var(--scifi-orange)", color: newText ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
                  fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600", cursor: newText ? "pointer" : "not-allowed",
                }}>SET</button>
              </div>
            </div>

            {/* Delete */}
            <button onClick={() => { previewRef.current?.deleteElement(); onClose(); }} style={{
              width: "100%", height: "32px", clipPath: btnClip4,
              backgroundColor: "transparent", border: "1px solid #dc2626", color: "#dc2626",
              fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
              <Trash2 className="w-3 h-3" /> DELETE ELEMENT
            </button>
          </div>
        )}

        {/* ── Advanced Tab ── */}
        {activeTab === "advanced" && (
          <div className="space-y-1">
            <Section title="Spacing" isOpen={spacingOpen} onToggle={() => setSpacingOpen(!spacingOpen)}>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="Pad Top" value={paddingTop} onChange={setPaddingTop} />
                <NumInput label="Pad Right" value={paddingRight} onChange={setPaddingRight} />
                <NumInput label="Pad Bottom" value={paddingBottom} onChange={setPaddingBottom} />
                <NumInput label="Pad Left" value={paddingLeft} onChange={setPaddingLeft} />
                <NumInput label="Margin Top" value={marginTop} onChange={setMarginTop} />
                <NumInput label="Margin Right" value={marginRight} onChange={setMarginRight} />
                <NumInput label="Margin Bottom" value={marginBottom} onChange={setMarginBottom} />
                <NumInput label="Margin Left" value={marginLeft} onChange={setMarginLeft} />
              </div>
              <ApplyBtn onClick={applySpacing}>APPLY SPACING</ApplyBtn>
            </Section>

            <Section title="Typography" isOpen={typographyOpen} onToggle={() => setTypographyOpen(!typographyOpen)}>
              <NumInput label="Font Size" value={fontSize} onChange={setFontSize} />
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Font Weight</label>
                <div className="flex gap-1">
                  {(["normal", "bold", "bolder"] as const).map((w) => (
                    <ToggleBtn key={w} active={fontWeight === w} onClick={() => setFontWeight(w)}>{w[0]}</ToggleBtn>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Text Align</label>
                <div className="flex gap-1">
                  {([{ v: "left" as const, i: <AlignLeft className="w-3 h-3" /> }, { v: "center" as const, i: <AlignCenter className="w-3 h-3" /> }, { v: "right" as const, i: <AlignRight className="w-3 h-3" /> }]).map(({ v, i }) => (
                    <ToggleBtn key={v} active={textAlign === v} onClick={() => setTextAlign(v)}>{i}</ToggleBtn>
                  ))}
                </div>
              </div>
              <ApplyBtn onClick={applyTypography}>APPLY TYPOGRAPHY</ApplyBtn>
            </Section>

            <Section title="Layout" isOpen={layoutOpen} onToggle={() => setLayoutOpen(!layoutOpen)}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Width</label>
                  <input type="text" placeholder="auto, 100%" value={width} onChange={(e) => setWidth(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Height</label>
                  <input type="text" placeholder="auto, 100%" value={height} onChange={(e) => setHeight(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                </div>
              </div>
              <NumInput label="Border Radius" value={borderRadius} onChange={setBorderRadius} />
              <ApplyBtn onClick={applyLayout}>APPLY LAYOUT</ApplyBtn>
            </Section>

            <Section title="Effects" isOpen={effectsOpen} onToggle={() => setEffectsOpen(!effectsOpen)}>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Opacity ({opacity}%)</label>
                <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(e.target.value)} style={{ width: "100%", accentColor: "var(--scifi-orange)" }} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Border</label>
                <div className="flex gap-2">
                  <input type="number" value={borderWidth} onChange={(e) => setBorderWidth(e.target.value)} min={0} max={20} style={{ ...inputStyle, flex: 1 }} />
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ width: "40px", height: "28px", border: "1px solid var(--scifi-orange)", cursor: "pointer" }} />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={labelStyle}>Box Shadow</label>
                <div className="grid grid-cols-3 gap-1">
                  <input type="number" value={shadowX} onChange={(e) => setShadowX(e.target.value)} placeholder="X" style={inputStyle} />
                  <input type="number" value={shadowY} onChange={(e) => setShadowY(e.target.value)} placeholder="Y" style={inputStyle} />
                  <input type="number" value={shadowBlur} onChange={(e) => setShadowBlur(e.target.value)} placeholder="Blur" min={0} style={inputStyle} />
                </div>
              </div>
              <ApplyBtn onClick={applyEffects}>APPLY EFFECTS</ApplyBtn>
            </Section>
          </div>
        )}

        {/* ── Custom Tab ── */}
        {activeTab === "custom" && (
          <div className="space-y-3">
            <textarea placeholder="Describe your change... (e.g., add shadow, make rounded)" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={5}
              style={{ width: "100%", backgroundColor: "var(--scifi-bg)", border: "1px solid var(--scifi-orange)", color: "var(--scifi-text)", fontFamily: "'Courier New', monospace", fontSize: "0.75rem", padding: "0.75rem", outline: "none", resize: "none" }}
            />
            <button onClick={handleCustomModification} disabled={!customPrompt} style={{
              width: "100%", height: "32px", clipPath: btnClip4,
              backgroundColor: customPrompt ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.3)",
              border: "1px solid var(--scifi-orange)", color: customPrompt ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
              fontFamily: "'Courier New', monospace", fontSize: "0.7rem", fontWeight: "600",
              cursor: customPrompt ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
              <Send className="w-3 h-3" /> APPLY CHANGE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
