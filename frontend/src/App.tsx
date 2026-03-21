import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Code2, RotateCcw, Zap, Eye, Box, Sparkles, Square, Palette, Moon, BarChart3, Plus, Edit3, Hand, Clock, Wand2 } from "lucide-react";
import { type DemoSketch } from "./utils/demoSketches";
import { CameraCapture } from "./components/CameraCapture";
import { LivePreview, type LivePreviewHandle } from "./components/LivePreview";
import { CodePanel } from "./components/CodePanel";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { VisualEditor } from "./components/VisualEditor";
import { ThreePanelLayout } from "./components/ThreePanelLayout";
import { InputPanel } from "./components/InputPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { saveGeneration } from "./api/generations";
import { useSketchToApp } from "./hooks/useSketchToApp";
import { ScifiPanel, ScifiButton, ScifiNav, ScifiBadge, ScifiMetricTile, ScifiProgressBar, ScifiStyleSelector, ScifiCustomStylePopover } from "./components/scifi";

export default function App() {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [showCustomStylePopover, setShowCustomStylePopover] = useState(false);
  const [customStyles, setCustomStyles] = useState<any[]>([]);
  const customStylesRef = useRef<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<LivePreviewHandle>(null);

  const BASE_STYLES = [
    { id: "modern", name: "Modern", icon: <Sparkles className="w-4 h-4" />, description: "Clean & minimal design" },
    { id: "glassmorphism", name: "Glass", icon: <Square className="w-4 h-4" />, description: "Glassmorphism style" },
    { id: "neobrutalism", name: "Neo Brutal", icon: <Palette className="w-4 h-4" />, description: "Bold & brutalist" },
    { id: "dark", name: "Dark", icon: <Moon className="w-4 h-4" />, description: "Dark premium theme" },
    { id: "saas", name: "Dashboard", icon: <BarChart3 className="w-4 h-4" />, description: "SaaS dashboard layout" },
  ];

  const STYLES = [...BASE_STYLES, ...customStyles];

  const PURPOSES = [
    { id: "landing",   name: "Landing" },
    { id: "portfolio", name: "Portfolio" },
    { id: "webapp",    name: "Web App" },
    { id: "poster",    name: "Poster" },
    { id: "dashboard", name: "Dashboard" },
    { id: "ecommerce", name: "Shop" },
    { id: "form",      name: "Form" },
    { id: "blog",      name: "Blog" },
    { id: "chat",      name: "Chat" },
    { id: "game",      name: "Game" },
    { id: "mobile",    name: "Mobile" },
    { id: "admin",     name: "Admin" },
  ];

  // Initialize hook first
  const { generate, loadMockData, loadResult, result, streamingCode, status, error, latency, reset, sessionId, currentGenId, bumpVersion } = useSketchToApp();

  const handleSaveCustomStyle = useCallback((styleData: any) => {
    const newStyle = {
      id: `custom-${Date.now()}`,
      name: styleData.name,
      icon: <Wand2 className="w-4 h-4" />,
      description: styleData.guidelines || styleData.description,
      custom: true,
      guidelines: styleData.guidelines || styleData.description,
    };
    setCustomStyles(prev => {
      const next = [...prev, newStyle];
      customStylesRef.current = next;
      return next;
    });
    setSelectedStyle(newStyle.id);
  }, []);

  const handleDeleteCustomStyle = useCallback((styleId: string) => {
    setCustomStyles(prev => {
      const next = prev.filter(s => s.id !== styleId);
      customStylesRef.current = next;
      return next;
    });
    if (selectedStyle === styleId) setSelectedStyle("modern");
  }, [selectedStyle]);

  // Get custom guidelines for current style (if it's a custom style)
  const getGuidelines = useCallback((styleId: string) => {
    return customStylesRef.current.find((s: any) => s.id === styleId)?.guidelines;
  }, []);

  const handleElementSelected = useCallback((element: any) => {
    if (editMode) {
      setSelectedElement(element);
    }
  }, [editMode]);

  const [hasEdits, setHasEdits] = useState(false);

  const handleModify = useCallback(
    (modification: string) => {
      setSelectedElement(null);
      setHasEdits(true);
    },
    []
  );

  const handleElementDragged = useCallback(
    (_element: any, _deltaX: number, _deltaY: number) => {
      setHasEdits(true);
    },
    []
  );

  const handleApplyEdits = useCallback(async (snapshotHtml?: string) => {
    if (!result) { console.log("[SAVE] No result"); return; }
    console.log("[SAVE] Saving edit...");
    try {
      const newVersion = bumpVersion();
      const editedComponent = snapshotHtml
        ? `export default function App() {\n  return <div dangerouslySetInnerHTML={{__html: \`${snapshotHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}} />;\n}`
        : result.component;
      await saveGeneration({
        component: editedComponent,
        description: result.description + ` (v${newVersion})`,
        style: selectedStyle,
        purpose: selectedPurpose ?? undefined,
        session_id: sessionId,
        parent_gen_id: currentGenId ?? undefined,
        version: newVersion,
      });
      console.log("[SAVE] Success");
      setHasEdits(false);
    } catch (e) {
      console.error("[SAVE] Failed:", e);
    }
  }, [result, selectedStyle, selectedPurpose, sessionId, currentGenId, bumpVersion]);

  const handleCapture = useCallback(
    (imageBase64: string) => {
      setSketchImage(imageBase64);
      generate(imageBase64, undefined, selectedStyle, selectedPurpose ?? undefined, getGuidelines(selectedStyle));
    },
    [generate, selectedStyle, selectedPurpose, getGuidelines]
  );

  const handleDemoSelect = useCallback(
    (sketch: DemoSketch) => {
      const imageBase64 = sketch.getImageBase64();
      setSketchImage(imageBase64);
      setSelectedPurpose(sketch.purpose);
      setSelectedStyle(sketch.style);
      generate(imageBase64, undefined, sketch.style, sketch.purpose);
    },
    [generate]
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
      generate(sketchImage, undefined, selectedStyle, selectedPurpose ?? undefined, getGuidelines(selectedStyle));
    }
  }, [sketchImage, generate, selectedStyle, selectedPurpose, getGuidelines]);

  const handleLoadFromHistory = useCallback((component: string, description: string) => {
    loadResult(component, description);
  }, [loadResult]);

  return (
    <div className="h-screen flex flex-col relative" style={{ backgroundColor: "var(--scifi-bg)" }}>
        {/* ─── Top Bar ─── */}
        <header
        className="relative z-10 flex items-center justify-between px-6 py-2.5"
        style={{
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
          backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
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
            <span
              className="text-[10px] uppercase tracking-wider mr-1"
              style={{
                color: "var(--scifi-text-dim)",
                fontFamily: "'Courier New', monospace",
                fontWeight: 600
              }}
            >
              OUTPUT STYLE:
            </span>
            <ScifiStyleSelector
              options={STYLES}
              selected={selectedStyle}
              onSelect={setSelectedStyle}
              onDelete={handleDeleteCustomStyle}
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

          {/* History Toggle */}
          <button
            onClick={() => { setShowHistory(!showHistory); setSelectedElement(null); }}
            title="Generation History"
            style={{
              width: "32px",
              height: "32px",
              clipPath: "polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px)",
              backgroundColor: showHistory ? "rgba(0, 212, 255, 0.2)" : "transparent",
              border: `1px solid ${showHistory ? "var(--scifi-cyan)" : "rgba(0, 212, 255, 0.3)"}`,
              color: "var(--scifi-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: showHistory ? "0 0 8px var(--scifi-cyan)40" : "none",
            }}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>


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
              onDemoSelect={handleDemoSelect}
              sketchImage={sketchImage}
              purposes={PURPOSES}
              selectedPurpose={selectedPurpose}
              onSelectPurpose={setSelectedPurpose}
            />
          }
          centerPanel={
            <PreviewPanel
              ref={previewRef}
              result={result}
              status={status}
              streamingCode={streamingCode}
              editMode={editMode}
              onElementSelected={handleElementSelected}
              onElementDragged={handleElementDragged}
              onModify={handleModify}
              onCloseEditor={() => setSelectedElement(null)}
              hasEdits={hasEdits}
              onApplyEdits={handleApplyEdits}
            />
          }
          rightPanel={
            selectedElement ? (
              <VisualEditor
                selectedElement={selectedElement}
                previewRef={previewRef}
                onModify={handleModify}
                onClose={() => setSelectedElement(null)}
              />
            ) : showHistory ? (
              <HistoryPanel onLoad={handleLoadFromHistory} sessionId={sessionId} />
            ) : null
          }
          showRightPanel={!!selectedElement || showHistory}
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
                status === "processing" || status === "streaming" ? "var(--scifi-orange)"
                  : status === "done" ? "var(--scifi-green)"
                  : status === "error" ? "#dc2626"
                  : "var(--scifi-cyan)",
              fontFamily: "'Courier New', monospace",
              border: `1px solid ${
                status === "processing" || status === "streaming" ? "var(--scifi-orange)"
                  : status === "done" ? "var(--scifi-green)"
                  : status === "error" ? "#dc2626"
                  : "var(--scifi-cyan)"
              }`,
              clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
            }}
          >
            {status === "idle" && "READY"}
            {status === "processing" && "ANALYZING"}
            {status === "streaming" && "STREAMING"}
            {status === "done" && "COMPLETE"}
            {status === "error" && "ERROR"}
          </span>
        </div>
      </footer>
    </div>
  );
}
