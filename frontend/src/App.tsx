import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Sparkles, Code2, RotateCcw, Download } from "lucide-react";
import { CameraCapture } from "./components/CameraCapture";
import { LivePreview } from "./components/LivePreview";
import { CodePanel } from "./components/CodePanel";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { useSketchToApp } from "./hooks/useSketchToApp";

export default function App() {
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const { generate, result, status, error, latency, reset } = useSketchToApp();

  const handleCapture = useCallback(
    (imageBase64: string) => {
      setSketchImage(imageBase64);
      generate(imageBase64);
    },
    [generate]
  );

  const handleReset = useCallback(() => {
    setSketchImage(null);
    setShowCode(false);
    reset();
  }, [reset]);

  const handleRegenerate = useCallback(() => {
    if (sketchImage) {
      generate(sketchImage);
    }
  }, [sketchImage, generate]);

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
            <p className="text-[10px] text-neutral-400">Powered by AWS Bedrock + Claude Vision</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sketch Input */}
        <div className="w-1/2 flex flex-col border-r border-neutral-200">
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Sketch input
            </span>
            {sketchImage && (
              <span className="text-[10px] text-emerald-600 font-medium">Captured</span>
            )}
          </div>

          <div className="flex-1 p-4">
            <CameraCapture onCapture={handleCapture} currentImage={sketchImage} />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Live preview
            </span>
            {latency && (
              <span className="text-[10px] text-neutral-400">
                Generated in {latency.total.toFixed(1)}s
                <span className="ml-2 text-neutral-300">
                  (AI: {latency.ai.toFixed(1)}s · Render: {latency.render.toFixed(1)}s)
                </span>
              </span>
            )}
          </div>

          <div className="flex-1 relative bg-neutral-100/50">
            {/* Processing overlay */}
            <AnimatePresence>
              {status === "processing" && (
                <ProcessingOverlay />
              )}
            </AnimatePresence>

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-sm text-red-500 mb-3">{error}</p>
                  <button onClick={handleRegenerate} className="btn-primary">
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Live Preview */}
            {result && status === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="h-full"
              >
                <LivePreview code={result.component} />
              </motion.div>
            )}

            {/* Empty state */}
            {!result && status === "idle" && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Your app will appear here</p>
                  <p className="text-xs mt-1">Capture or upload a sketch to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
      <footer className="px-6 py-2 border-t border-neutral-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] text-neutral-400">
          <span>Model: Claude Sonnet via Bedrock</span>
          <span>·</span>
          <span>Region: us-east-1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              status === "processing"
                ? "bg-amber-400 animate-pulse"
                : status === "done"
                ? "bg-emerald-400"
                : "bg-neutral-300"
            }`}
          />
          <span className="text-[10px] text-neutral-400">
            {status === "idle" && "Ready"}
            {status === "processing" && "Generating..."}
            {status === "done" && "Complete"}
            {status === "error" && "Error"}
          </span>
        </div>
      </footer>
    </div>
  );
}
