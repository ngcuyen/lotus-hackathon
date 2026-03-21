import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Code2, RotateCcw, Zap, Eye, Box, Sparkles, Square, Palette, Moon, BarChart3, Plus, Edit3, Hand } from "lucide-react";
import { CameraCapture } from "./components/CameraCapture";
import { LivePreview } from "./components/LivePreview";
import { CodePanel } from "./components/CodePanel";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { VisualEditor } from "./components/VisualEditor";
import { PanelCustomizer, CustomizationSettings } from "./components/PanelCustomizer";
import { ThreePanelLayout } from "./components/ThreePanelLayout";
import { InputPanel } from "./components/InputPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { useSketchToApp } from "./hooks/useSketchToApp";
import { ScifiPanel, ScifiButton, ScifiNav, ScifiBadge, ScifiMetricTile, ScifiProgressBar, ScifiStyleSelector, ScifiCustomStylePopover } from "./components/scifi";

export default function App() {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [showCustomStylePopover, setShowCustomStylePopover] = useState(false);
  const [customStyles, setCustomStyles] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [panelSettings, setPanelSettings] = useState<CustomizationSettings>({
    panelOpacity: 75,
    panelBlur: 12,
    borderGlow: true,
    animationSpeed: "normal",
    colorScheme: "cyan",
    fontSize: "medium",
    spacing: "normal",
  });
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const BASE_STYLES = [
    { id: "modern", name: "Modern", icon: <Sparkles className="w-4 h-4" />, description: "Clean & minimal design" },
    { id: "glassmorphism", name: "Glass", icon: <Square className="w-4 h-4" />, description: "Glassmorphism style" },
    { id: "neobrutalism", name: "Neo Brutal", icon: <Palette className="w-4 h-4" />, description: "Bold & brutalist" },
    { id: "dark", name: "Dark", icon: <Moon className="w-4 h-4" />, description: "Dark premium theme" },
    { id: "saas", name: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, description: "SaaS dashboard layout" },
  ];

  const STYLES = [...BASE_STYLES, ...customStyles];

  // Initialize hook first
  const { generate, loadMockData, result, status, error, latency, reset } = useSketchToApp();

  const handleSaveCustomStyle = useCallback((styleData: any) => {
    const newStyle = {
      id: `custom-${Date.now()}`,
      name: styleData.name,
      icon: <Palette className="w-4 h-4" />,
      description: styleData.description,
      custom: true,
      data: styleData,
    };
    setCustomStyles(prev => [...prev, newStyle]);
    setSelectedStyle(newStyle.id);
  }, []);

  const handleElementSelected = useCallback((element: any) => {
    if (editMode) {
      setSelectedElement(element);
    }
  }, [editMode]);

  const handleModify = useCallback(
    (modification: string) => {
      if (sketchImage && result) {
        generate(sketchImage, modification, selectedStyle);
        setSelectedElement(null);
      }
    },
    [sketchImage, result, selectedStyle, generate]
  );

  const handleElementDragged = useCallback(
    (element: any, deltaX: number, deltaY: number) => {
      if (sketchImage && result) {
        const direction = [];
        if (deltaX > 0) direction.push(`${deltaX}px to the right`);
        else if (deltaX < 0) direction.push(`${Math.abs(deltaX)}px to the left`);
        if (deltaY > 0) direction.push(`${deltaY}px down`);
        else if (deltaY < 0) direction.push(`${Math.abs(deltaY)}px up`);

        const modification = `Move the ${element.tagName.toLowerCase()} ${direction.join(' and ')}`;
        generate(sketchImage, modification, selectedStyle);
        setSelectedElement(null);
      }
    },
    [sketchImage, result, selectedStyle, generate]
  );

  const handleCapture = useCallback(
    (imageBase64: string) => {
      setSketchImage(imageBase64);

      // Mock data for testing UI (remove when backend is ready)
      const mockResult = {
        component: `import { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <button className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg">
              Sign In
            </button>

            <p className="text-center text-sm text-blue-600 hover:underline cursor-pointer">
              Forgot password?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}`,
        description: "Login form with email and password inputs"
      };

      // Simulate processing delay
      setTimeout(() => {
        // @ts-ignore - accessing internal state for mock
        if (result === null) {
          // You can manually set this in DevTools or use real API
          console.log("Using mock data. To use real API, start backend and call generate()");
          // Uncomment when backend is ready:
          // generate(imageBase64, undefined, selectedStyle);
        }
      }, 100);
    },
    [generate, selectedStyle, result]
  );

  const handleReset = useCallback(() => {
    setSketchImage(null);
    setShowCode(false);
    setEditMode(false);
    setSelectedElement(null);
    reset();
  }, [reset]);

  const handleRegenerate = useCallback(() => {
    if (sketchImage) {
      generate(sketchImage, undefined, selectedStyle);
    }
  }, [sketchImage, generate, selectedStyle]);

  return (
    <div className="h-screen flex flex-col relative" style={{ backgroundColor: "var(--scifi-bg)" }}>
        {/* ─── Top Bar ─── */}
        <header
        className="relative flex items-center justify-between px-6 py-2.5"
        style={{
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
          backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 50,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-icon.svg"
              alt="Sketch2App"
              className="w-9 h-9"
              style={{ filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.4))" }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-wider leading-none" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}>
                SKETCH2APP
              </span>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                Neural Interface
              </span>
            </div>
          </div>
          <div className="h-6 w-px" style={{ backgroundColor: "rgba(0, 212, 255, 0.3)" }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
            BEDROCK CLAUDE VISION
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Style selector */}
          <div className="flex items-center gap-1.5">
            <ScifiStyleSelector
              options={STYLES}
              selected={selectedStyle}
              onSelect={setSelectedStyle}
            />
            {/* Add custom style button */}
            <button
              ref={addButtonRef}
              onClick={() => setShowCustomStylePopover(!showCustomStylePopover)}
              title="Create Custom Style"
              style={{
                width: "32px",
                height: "32px",
                clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
                backgroundColor: "transparent",
                border: "1px dashed var(--scifi-green)",
                color: "var(--scifi-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(57, 255, 20, 0.1)";
                e.currentTarget.style.boxShadow = "0 0 8px var(--scifi-green)40";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Popover (fixed positioning) */}
          <ScifiCustomStylePopover
            isOpen={showCustomStylePopover}
            onClose={() => setShowCustomStylePopover(false)}
            onSave={handleSaveCustomStyle}
            anchorEl={addButtonRef.current}
          />

          <div className="h-6 w-px" style={{ backgroundColor: "rgba(255, 106, 0, 0.3)" }} />

          {/* Edit Mode Toggle */}
          {result && (
            <>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  setSelectedElement(null);
                }}
                title={editMode ? "Interactive Mode" : "Edit Mode"}
                style={{
                  width: "32px",
                  height: "32px",
                  clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
                  backgroundColor: editMode ? "rgba(0, 212, 255, 0.2)" : "transparent",
                  border: `1px solid ${editMode ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.3)"}`,
                  color: "var(--scifi-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: editMode ? "0 0 8px var(--scifi-cyan)40" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!editMode) {
                    e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "0 0 8px var(--scifi-cyan)40";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!editMode) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {editMode ? <Edit3 className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
              </button>
              <div className="h-6 w-px" style={{ backgroundColor: "rgba(255, 106, 0, 0.3)" }} />
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {result && (
              <>
                <button
                  onClick={() => setShowCode(!showCode)}
                  title={showCode ? "Hide Code" : "View Code"}
                  style={{
                    width: "32px",
                    height: "32px",
                    clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--scifi-cyan)",
                    color: "var(--scifi-cyan)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "0 0 8px var(--scifi-cyan)40";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRegenerate}
                  title="Regenerate"
                  style={{
                    width: "32px",
                    height: "32px",
                    clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--scifi-orange)",
                    color: "var(--scifi-orange)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 106, 0, 0.1)";
                    e.currentTarget.style.boxShadow = "0 0 8px var(--scifi-orange)40";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              style={{
                height: "32px",
                clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
                backgroundColor: "var(--scifi-cyan)",
                border: "1px solid var(--scifi-cyan)",
                color: "var(--scifi-bg)",
                padding: "0 0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.7rem",
                fontWeight: "600",
                letterSpacing: "0.05em",
                transition: "all 0.2s ease",
                boxShadow: "0 0 8px var(--scifi-cyan)60",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 0 12px var(--scifi-cyan)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 8px var(--scifi-cyan)60";
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              NEW
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Split View ─── */}
      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 relative z-10" style={{ minHeight: 0 }}>
        <ThreePanelLayout
          leftPanel={
            <InputPanel
              onCapture={handleCapture}
              onGenerate={(image, prompt) => generate(image, prompt, selectedStyle)}
              style={selectedStyle}
            />
          }
          centerPanel={
            <PreviewPanel
              result={result}
              editMode={editMode}
              selectedElement={selectedElement}
              onElementSelected={handleElementSelected}
              onElementDragged={handleElementDragged}
              onModify={handleModify}
              onCloseEditor={() => setSelectedElement(null)}
            />
          }
          rightPanel={
            <PanelCustomizer
              onApply={(settings) => {
                setPanelSettings(settings);
                console.log("Applied panel settings:", settings);
              }}
            />
          }
          showRightPanel={!!selectedElement}
        />
      </div>

      {/* ─── Bottom Code Panel (collapsible) ─── */}
      <AnimatePresence>
        {showCode && result && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 200 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-200"
          >
            <CodePanel code={result.component} description={result.description} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Status Bar ─── */}
      <footer
        className="relative z-10 px-6 py-2 flex items-center justify-between"
        style={{
          borderTop: "1px solid rgba(0, 212, 255, 0.2)",
          backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Box className="w-2.5 h-2.5" style={{ color: "var(--scifi-cyan)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
              CLAUDE SONNET 4
            </span>
          </div>
          <div className="h-3 w-px" style={{ backgroundColor: "rgba(0, 212, 255, 0.2)" }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
            US-EAST-1
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "processing" && latency && (
            <ScifiProgressBar value={(latency.ai / 10) * 100} color="cyan" showValue={false} className="w-24" />
          )}
          <span
            className="text-[10px] font-semibold tracking-wider px-2 py-0.5"
            style={{
              color:
                status === "processing" ? "var(--scifi-orange)"
                  : status === "done" ? "var(--scifi-green)"
                  : status === "error" ? "#dc2626"
                  : "var(--scifi-cyan)",
              fontFamily: "'Courier New', monospace",
              border: `1px solid ${
                status === "processing" ? "var(--scifi-orange)"
                  : status === "done" ? "var(--scifi-green)"
                  : status === "error" ? "#dc2626"
                  : "var(--scifi-cyan)"
              }`,
              clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
            }}
          >
            {status === "idle" && "READY"}
            {status === "processing" && "GENERATING"}
            {status === "done" && "COMPLETE"}
            {status === "error" && "ERROR"}
          </span>
        </div>
      </footer>
    </div>
  );
}
