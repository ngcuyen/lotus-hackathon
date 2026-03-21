import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Code2, RotateCcw } from "lucide-react";
import { CameraCapture } from "./components/CameraCapture";
import { LivePreview } from "./components/LivePreview";
import { CodePanel } from "./components/CodePanel";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { useSketchToApp } from "./hooks/useSketchToApp";
import { DEMO_SKETCHES } from "./utils/demoSketches";

export default function App() {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [showXRay, setShowXRay] = useState(false);

  const STYLES = [
    { id: "modern",        name: "Modern",    emoji: "✨" },
    { id: "glassmorphism", name: "Glass",     emoji: "🪟" },
    { id: "neobrutalism",  name: "Brutal",    emoji: "🎨" },
    { id: "dark",          name: "Dark",      emoji: "🌙" },
    { id: "saas",          name: "Dashboard", emoji: "📊" },
  ];

  const PURPOSES = [
    { id: "landing",   emoji: "🌐", name: "Landing" },
    { id: "game",      emoji: "🎮", name: "Game" },
    { id: "card",      emoji: "💳", name: "Card" },
    { id: "form",      emoji: "📋", name: "Form" },
    { id: "ecommerce", emoji: "🛒", name: "Shop" },
    { id: "dashboard", emoji: "📊", name: "Dashboard" },
    { id: "chat",      emoji: "💬", name: "Chat" },
    { id: "todo",      emoji: "✅", name: "Todo" },
  ];

  const { generate, result, status, agentStep, error, latency, reset } = useSketchToApp();

  const handleCapture = useCallback(
    (imageBase64: string) => {
      setSketchImage(imageBase64);
      setShowXRay(false);
      generate(imageBase64, undefined, selectedStyle, selectedPurpose ?? undefined);
    },
    [generate, selectedStyle, selectedPurpose]
  );

  const handleReset = useCallback(() => {
    setSketchImage(null);
    setShowCode(false);
    setShowXRay(false);
    reset();
  }, [reset]);

  const handleRegenerate = useCallback(() => {
    if (sketchImage) {
      setShowXRay(false);
      generate(sketchImage, undefined, selectedStyle, selectedPurpose ?? undefined);
    }
  }, [sketchImage, generate, selectedStyle, selectedPurpose]);

  // ── Demo example handler ────────────────────────────────────────────────
  const handleDemo = useCallback((demoId: string) => {
    const demo = DEMO_SKETCHES.find((d) => d.id === demoId);
    if (!demo) return;
    const imageBase64 = demo.getImageBase64();
    setSketchImage(imageBase64);
    setSelectedPurpose(demo.purpose);
    setSelectedStyle(demo.style);
    setShowXRay(false);
    generate(imageBase64, undefined, demo.style, demo.purpose);
  }, [generate]);

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Sketch → Living App</h1>
            <p className="text-[10px] text-neutral-400">Powered by AWS Bedrock · Claude Vision · 2-step agent</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Style selector */}
          <div className="flex items-center gap-1 mr-2 border-r border-neutral-200 pr-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedStyle === s.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
                title={s.name}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>

          {result && (
            <>
              {/* X-Ray reveal button */}
              <button
                onClick={() => setShowXRay((v) => !v)}
                title="Overlay your sketch on the generated UI"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  showXRay
                    ? "bg-violet-100 text-violet-700 border border-violet-200"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                <span>✦</span> X-Ray
              </button>
              <button onClick={() => setShowCode(!showCode)} className="btn-ghost flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                {showCode ? "Hide code" : "View code"}
              </button>
              <button onClick={handleRegenerate} className="btn-ghost flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </>
          )}
          <button onClick={handleReset} className="btn-secondary">
            New sketch
          </button>
        </div>
      </header>

      {/* ─── Main Split View ─── */}
      <div className="flex-1 flex" style={{ minHeight: 0 }}>
        {/* ─── Left: Sketch Input ─── */}
        <div className="w-1/2 flex flex-col border-r border-neutral-200 overflow-y-auto">
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Sketch input</span>
            {sketchImage && <span className="text-[10px] text-emerald-600 font-medium">Captured</span>}
          </div>

          {/* Purpose Selector */}
          <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                What are you building?
              </span>
              {selectedPurpose && (
                <button
                  onClick={() => setSelectedPurpose(null)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPurpose(selectedPurpose === p.id ? null : p.id)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border text-center transition-all ${
                    selectedPurpose === p.id
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  <span className="text-base leading-none">{p.emoji}</span>
                  <span className="text-[9px] font-medium leading-tight">{p.name}</span>
                </button>
              ))}
            </div>
            {selectedPurpose && (
              <p className="mt-2 text-[10px] text-neutral-400">
                AI will interpret your sketch as a{" "}
                <span className="font-semibold text-neutral-600">
                  {PURPOSES.find((p) => p.id === selectedPurpose)?.name}
                </span>
              </p>
            )}
          </div>

          {/* Demo Examples — only visible when no sketch captured */}
          {!sketchImage && (
            <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Try an example →
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_SKETCHES.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemo(demo.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-neutral-200
                               bg-white hover:border-neutral-400 hover:bg-neutral-50
                               hover:shadow-sm transition-all text-left group"
                  >
                    <span className="text-xl shrink-0">{demo.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 group-hover:text-neutral-900 leading-tight">
                        {demo.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                        {demo.tagline}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Camera / Draw / Upload */}
          <div className="flex-1 p-4">
            <CameraCapture onCapture={handleCapture} currentImage={sketchImage} />
          </div>
        </div>

        {/* ─── Right: Live Preview ─── */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Live preview</span>
            <div className="flex items-center gap-3">
              {latency && (
                <span className="text-[10px] text-neutral-400">
                  Generated in {latency.total.toFixed(1)}s
                  <span className="ml-1.5 text-neutral-300">(AI: {latency.ai.toFixed(1)}s)</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            {/* 2-step Agent Progress Overlay */}
            <AnimatePresence>
              {status === "processing" && (
                <ProcessingOverlay agentStep={agentStep} />
              )}
            </AnimatePresence>

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
                <div className="text-center">
                  <p className="text-sm text-red-500 mb-3">{error}</p>
                  <button onClick={handleRegenerate} className="btn-primary">Try again</button>
                </div>
              </div>
            )}

            {/* Live Preview */}
            {result && <LivePreview code={result.component} />}

            {/* ✦ X-Ray sketch overlay */}
            <AnimatePresence>
              {showXRay && sketchImage && result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                >
                  {/* Dark badge */}
                  <div className="absolute top-3 left-3 z-30 bg-violet-600 text-white text-[10px] font-bold
                                  px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <span>✦</span> X-Ray mode
                  </div>
                  <img
                    src={`data:image/png;base64,${sketchImage}`}
                    alt="sketch overlay"
                    className="w-full h-full object-contain"
                    style={{ mixBlendMode: "multiply", opacity: 0.45 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!result && status === "idle" && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Your app will appear here</p>
                  <p className="text-xs mt-1 text-neutral-300">
                    Pick an example or capture a sketch to begin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Code Panel ─── */}
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
      <footer className="px-6 py-2 border-t border-neutral-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] text-neutral-400">
          <span>Model: Claude Sonnet via Bedrock</span>
          <span>·</span>
          <span>Region: us-east-1</span>
          {agentStep && (
            <>
              <span>·</span>
              <span className="text-violet-500 font-medium">
                Agent: {agentStep === "analyzing" ? "🔍 Analyzing" : "⚡ Generating"}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            status === "processing" ? "bg-amber-400 animate-pulse"
              : status === "done" ? "bg-emerald-400"
              : "bg-neutral-300"
          }`} />
          <span className="text-[10px] text-neutral-400">
            {status === "idle" && "Ready"}
            {status === "processing" && (agentStep === "analyzing" ? "Analyzing sketch..." : "Generating code...")}
            {status === "done" && "Complete"}
            {status === "error" && "Error"}
          </span>
        </div>
      </footer>
    </div>
  );
}
