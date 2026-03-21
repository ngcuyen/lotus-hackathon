import { useState } from "react";
import { Trash2, Move, Type, Palette, Maximize2, Send, ChevronDown, ChevronRight, Box, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { ScifiPanel } from "./scifi/ScifiPanel";

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
  onModify: (modification: string) => void;
  onClose: () => void;
}

export function VisualEditor({ selectedElement, onModify, onClose }: VisualEditorProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "advanced" | "custom">("quick");
  const [customPrompt, setCustomPrompt] = useState("");

  // Quick controls
  const [selectedColor, setSelectedColor] = useState("#00d4ff");
  const [selectedBgColor, setSelectedBgColor] = useState("#ffffff");
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">("medium");
  const [newText, setNewText] = useState("");

  // Advanced controls
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

  // Collapse states
  const [spacingOpen, setSpacingOpen] = useState(true);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);

  if (!selectedElement) return null;

  const handleColorChange = () => {
    onModify(`Change the text color of this ${selectedElement.tagName.toLowerCase()} to ${selectedColor}`);
  };

  const handleBgColorChange = () => {
    onModify(`Change the background color of this ${selectedElement.tagName.toLowerCase()} to ${selectedBgColor}`);
  };

  const handleSizeChange = (size: "small" | "medium" | "large") => {
    setSelectedSize(size);
    const sizeMap = { small: "smaller", medium: "medium", large: "larger" };
    onModify(`Make this ${selectedElement.tagName.toLowerCase()} ${sizeMap[size]}`);
  };

  const handleTextChange = () => {
    if (newText) {
      onModify(`Change the text of this ${selectedElement.tagName.toLowerCase()} to "${newText}"`);
    }
  };

  const handleDelete = () => {
    onModify(`Remove this ${selectedElement.tagName.toLowerCase()} element`);
  };

  const handleCustomModification = () => {
    if (customPrompt) {
      onModify(customPrompt);
      setCustomPrompt("");
    }
  };

  const applySpacing = () => {
    const mods = [];
    if (paddingTop !== "0") mods.push(`padding-top: ${paddingTop}px`);
    if (paddingRight !== "0") mods.push(`padding-right: ${paddingRight}px`);
    if (paddingBottom !== "0") mods.push(`padding-bottom: ${paddingBottom}px`);
    if (paddingLeft !== "0") mods.push(`padding-left: ${paddingLeft}px`);
    if (marginTop !== "0") mods.push(`margin-top: ${marginTop}px`);
    if (marginRight !== "0") mods.push(`margin-right: ${marginRight}px`);
    if (marginBottom !== "0") mods.push(`margin-bottom: ${marginBottom}px`);
    if (marginLeft !== "0") mods.push(`margin-left: ${marginLeft}px`);

    if (mods.length > 0) {
      onModify(`Update this ${selectedElement.tagName.toLowerCase()} with: ${mods.join(", ")}`);
    }
  };

  const applyTypography = () => {
    const mods = [];
    if (fontSize !== "16") mods.push(`font-size: ${fontSize}px`);
    if (fontWeight !== "normal") mods.push(`font-weight: ${fontWeight}`);
    if (textAlign !== "left") mods.push(`text-align: ${textAlign}`);

    if (mods.length > 0) {
      onModify(`Update this ${selectedElement.tagName.toLowerCase()} typography: ${mods.join(", ")}`);
    }
  };

  const applyLayout = () => {
    const mods = [];
    if (width) mods.push(`width: ${width}`);
    if (height) mods.push(`height: ${height}`);
    if (borderRadius !== "0") mods.push(`border-radius: ${borderRadius}px`);

    if (mods.length > 0) {
      onModify(`Update this ${selectedElement.tagName.toLowerCase()} layout: ${mods.join(", ")}`);
    }
  };

  const applyEffects = () => {
    const mods = [];
    if (opacity !== "100") mods.push(`opacity: ${parseInt(opacity) / 100}`);
    if (borderWidth !== "0") mods.push(`border: ${borderWidth}px solid ${borderColor}`);
    if (shadowBlur !== "0") {
      mods.push(`box-shadow: ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    }

    if (mods.length > 0) {
      onModify(`Update this ${selectedElement.tagName.toLowerCase()} effects: ${mods.join(", ")}`);
    }
  };

  const CollapsibleSection = ({ title, isOpen, onToggle, children }: any) => (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-2"
        style={{
          color: "var(--scifi-orange)",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.7rem",
          fontWeight: "600",
          textTransform: "uppercase",
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: "0.25rem 0",
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );

  const InputGroup = ({ label, value, onChange, unit = "px", min = 0, max = 500 }: any) => (
    <div>
      <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
        {label}
      </label>
      <div className="flex gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          style={{
            flex: 1,
            height: "28px",
            backgroundColor: "var(--scifi-bg)",
            border: "1px solid rgba(255, 106, 0, 0.3)",
            color: "var(--scifi-text)",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.7rem",
            padding: "0 0.5rem",
            outline: "none",
          }}
        />
        <span
          className="flex items-center justify-center"
          style={{
            width: "32px",
            height: "28px",
            border: "1px solid rgba(255, 106, 0, 0.3)",
            color: "var(--scifi-text-dim)",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.65rem",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="fixed right-4 top-20 z-40 overflow-y-auto"
      style={{
        width: "340px",
        maxHeight: "calc(100vh - 100px)",
      }}
    >
      <ScifiPanel variant="orange" className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Move className="w-4 h-4" style={{ color: "var(--scifi-orange)" }} />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--scifi-orange)", fontFamily: "'Courier New', monospace" }}
              >
                EDIT ELEMENT
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              {selectedElement.tagName}
              {selectedElement.className && `.${selectedElement.className.split(" ")[0]}`}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              color: "var(--scifi-text-dim)",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--scifi-orange)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--scifi-text-dim)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {[
            { id: "quick", label: "QUICK" },
            { id: "advanced", label: "ADVANCED" },
            { id: "custom", label: "CUSTOM" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                height: "26px",
                clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                backgroundColor: activeTab === tab.id ? "var(--scifi-orange)" : "transparent",
                border: `1px solid var(--scifi-orange)`,
                color: activeTab === tab.id ? "var(--scifi-bg)" : "var(--scifi-orange)",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.65rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        {activeTab === "quick" && (
          <div className="space-y-3">
            {/* Text Color */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                <Type className="w-3 h-3 inline mr-1" />
                TEXT COLOR
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{
                    width: "40px",
                    height: "32px",
                    border: "1px solid var(--scifi-orange)",
                    cursor: "pointer",
                  }}
                />
                <button
                  onClick={handleColorChange}
                  style={{
                    flex: 1,
                    height: "32px",
                    clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                    backgroundColor: "var(--scifi-orange)",
                    border: "1px solid var(--scifi-orange)",
                    color: "var(--scifi-bg)",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  APPLY
                </button>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                <Palette className="w-3 h-3 inline mr-1" />
                BG COLOR
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedBgColor}
                  onChange={(e) => setSelectedBgColor(e.target.value)}
                  style={{
                    width: "40px",
                    height: "32px",
                    border: "1px solid var(--scifi-orange)",
                    cursor: "pointer",
                  }}
                />
                <button
                  onClick={handleBgColorChange}
                  style={{
                    flex: 1,
                    height: "32px",
                    clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                    backgroundColor: "var(--scifi-orange)",
                    border: "1px solid var(--scifi-orange)",
                    color: "var(--scifi-bg)",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  APPLY
                </button>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                <Maximize2 className="w-3 h-3 inline mr-1" />
                SIZE
              </label>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    style={{
                      flex: 1,
                      height: "28px",
                      clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                      backgroundColor: selectedSize === size ? "var(--scifi-orange)" : "transparent",
                      border: `1px solid var(--scifi-orange)`,
                      color: selectedSize === size ? "var(--scifi-bg)" : "var(--scifi-orange)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.65rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {size[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace", fontWeight: "600" }}>
                <Type className="w-3 h-3 inline mr-1" />
                TEXT
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={selectedElement.textContent.slice(0, 20) || "Enter new text"}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  style={{
                    flex: 1,
                    height: "32px",
                    backgroundColor: "var(--scifi-bg)",
                    border: "none",
                    borderBottom: "2px solid var(--scifi-orange)",
                    color: "var(--scifi-text)",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.75rem",
                    padding: "0.5rem",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleTextChange}
                  disabled={!newText}
                  style={{
                    width: "60px",
                    height: "32px",
                    clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                    backgroundColor: newText ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.3)",
                    border: "1px solid var(--scifi-orange)",
                    color: newText ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    cursor: newText ? "pointer" : "not-allowed",
                  }}
                >
                  SET
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={handleDelete}
              style={{
                width: "100%",
                height: "32px",
                clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                backgroundColor: "transparent",
                border: "1px solid #dc2626",
                color: "#dc2626",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.7rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Trash2 className="w-3 h-3" />
              DELETE ELEMENT
            </button>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === "advanced" && (
          <div className="space-y-1">
            {/* Spacing Section */}
            <CollapsibleSection title="Spacing" isOpen={spacingOpen} onToggle={() => setSpacingOpen(!spacingOpen)}>
              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Padding Top" value={paddingTop} onChange={setPaddingTop} />
                <InputGroup label="Padding Right" value={paddingRight} onChange={setPaddingRight} />
                <InputGroup label="Padding Bottom" value={paddingBottom} onChange={setPaddingBottom} />
                <InputGroup label="Padding Left" value={paddingLeft} onChange={setPaddingLeft} />
                <InputGroup label="Margin Top" value={marginTop} onChange={setMarginTop} />
                <InputGroup label="Margin Right" value={marginRight} onChange={setMarginRight} />
                <InputGroup label="Margin Bottom" value={marginBottom} onChange={setMarginBottom} />
                <InputGroup label="Margin Left" value={marginLeft} onChange={setMarginLeft} />
              </div>
              <button
                onClick={applySpacing}
                style={{
                  width: "100%",
                  height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: "var(--scifi-orange)",
                  border: "1px solid var(--scifi-orange)",
                  color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.65rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                APPLY SPACING
              </button>
            </CollapsibleSection>

            {/* Typography Section */}
            <CollapsibleSection title="Typography" isOpen={typographyOpen} onToggle={() => setTypographyOpen(!typographyOpen)}>
              <InputGroup label="Font Size" value={fontSize} onChange={setFontSize} min={8} max={72} />

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Font Weight
                </label>
                <div className="flex gap-1">
                  {(["normal", "bold", "bolder"] as const).map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setFontWeight(weight)}
                      style={{
                        flex: 1,
                        height: "28px",
                        clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                        backgroundColor: fontWeight === weight ? "var(--scifi-orange)" : "transparent",
                        border: `1px solid var(--scifi-orange)`,
                        color: fontWeight === weight ? "var(--scifi-bg)" : "var(--scifi-orange)",
                        fontFamily: "'Courier New', monospace",
                        fontSize: "0.6rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      {weight[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Text Align
                </label>
                <div className="flex gap-1">
                  {[
                    { value: "left" as const, icon: <AlignLeft className="w-3 h-3" /> },
                    { value: "center" as const, icon: <AlignCenter className="w-3 h-3" /> },
                    { value: "right" as const, icon: <AlignRight className="w-3 h-3" /> },
                  ].map(({ value, icon }) => (
                    <button
                      key={value}
                      onClick={() => setTextAlign(value)}
                      style={{
                        flex: 1,
                        height: "28px",
                        clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                        backgroundColor: textAlign === value ? "var(--scifi-orange)" : "transparent",
                        border: `1px solid var(--scifi-orange)`,
                        color: textAlign === value ? "var(--scifi-bg)" : "var(--scifi-orange)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={applyTypography}
                style={{
                  width: "100%",
                  height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: "var(--scifi-orange)",
                  border: "1px solid var(--scifi-orange)",
                  color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.65rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                APPLY TYPOGRAPHY
              </button>
            </CollapsibleSection>

            {/* Layout Section */}
            <CollapsibleSection title="Layout" isOpen={layoutOpen} onToggle={() => setLayoutOpen(!layoutOpen)}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                    Width
                  </label>
                  <input
                    type="text"
                    placeholder="auto, 100%, 200px"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    style={{
                      width: "100%",
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                    Height
                  </label>
                  <input
                    type="text"
                    placeholder="auto, 100%, 200px"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    style={{
                      width: "100%",
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <InputGroup label="Border Radius" value={borderRadius} onChange={setBorderRadius} max={100} />
              <button
                onClick={applyLayout}
                style={{
                  width: "100%",
                  height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: "var(--scifi-orange)",
                  border: "1px solid var(--scifi-orange)",
                  color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.65rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                APPLY LAYOUT
              </button>
            </CollapsibleSection>

            {/* Effects Section */}
            <CollapsibleSection title="Effects" isOpen={effectsOpen} onToggle={() => setEffectsOpen(!effectsOpen)}>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Opacity ({opacity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(e.target.value)}
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Border
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(e.target.value)}
                    placeholder="Width"
                    min="0"
                    max="20"
                    style={{
                      flex: 1,
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    style={{
                      width: "40px",
                      height: "28px",
                      border: "1px solid var(--scifi-orange)",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Box Shadow
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={shadowX}
                    onChange={(e) => setShadowX(e.target.value)}
                    placeholder="X"
                    style={{
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    value={shadowY}
                    onChange={(e) => setShadowY(e.target.value)}
                    placeholder="Y"
                    style={{
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(e.target.value)}
                    placeholder="Blur"
                    min="0"
                    style={{
                      height: "28px",
                      backgroundColor: "var(--scifi-bg)",
                      border: "1px solid rgba(255, 106, 0, 0.3)",
                      color: "var(--scifi-text)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.7rem",
                      padding: "0 0.5rem",
                      outline: "none",
                    }}
                  />
                </div>
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: "28px",
                    border: "1px solid var(--scifi-orange)",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                />
              </div>

              <button
                onClick={applyEffects}
                style={{
                  width: "100%",
                  height: "28px",
                  clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
                  backgroundColor: "var(--scifi-orange)",
                  border: "1px solid var(--scifi-orange)",
                  color: "var(--scifi-bg)",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.65rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                APPLY EFFECTS
              </button>
            </CollapsibleSection>
          </div>
        )}

        {/* Custom Prompt */}
        {activeTab === "custom" && (
          <div className="space-y-3">
            <textarea
              placeholder="Describe your change... (e.g., add shadow, make it rounded, change to gradient)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                backgroundColor: "var(--scifi-bg)",
                border: "1px solid var(--scifi-orange)",
                color: "var(--scifi-text)",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.75rem",
                padding: "0.75rem",
                outline: "none",
                resize: "none",
              }}
            />
            <button
              onClick={handleCustomModification}
              disabled={!customPrompt}
              style={{
                width: "100%",
                height: "32px",
                clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
                backgroundColor: customPrompt ? "var(--scifi-orange)" : "rgba(255, 106, 0, 0.3)",
                border: "1px solid var(--scifi-orange)",
                color: customPrompt ? "var(--scifi-bg)" : "var(--scifi-text-dim)",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.7rem",
                fontWeight: "600",
                cursor: customPrompt ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <Send className="w-3 h-3" />
              APPLY CHANGE
            </button>
          </div>
        )}
      </ScifiPanel>
    </div>
  );
}
