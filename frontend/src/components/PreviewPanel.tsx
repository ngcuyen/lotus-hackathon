import { useRef, useState, useEffect, forwardRef } from "react";
import { Box } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { LivePreview, type LivePreviewHandle } from "./LivePreview";
import { ProcessingOverlay } from "./ProcessingOverlay";

interface PreviewPanelProps {
  result: any;
  status: "idle" | "processing" | "streaming" | "done" | "error";
  streamingCode?: string;
  editMode: boolean;
  onElementSelected: (element: any) => void;
  onElementDragged: (element: any, deltaX: number, deltaY: number) => void;
  onModify: (modifications: any) => void;
  onCloseEditor: () => void;
  hasEdits?: boolean;
  onApplyEdits?: (html: string) => void;
}

export const PreviewPanel = forwardRef<LivePreviewHandle, PreviewPanelProps>(
  function PreviewPanel({
    result,
    status,
    streamingCode = "",
    editMode,
    onElementSelected,
    onElementDragged,
    hasEdits = false,
    onApplyEdits,
  }, ref) {
    const livePreviewRef = useRef<LivePreviewHandle>(null);

    // Expose LivePreview handle to parent (for VisualEditor direct manipulation)
    // Forward both internal ref and external ref to the same LivePreview
    const combinedRef = (instance: LivePreviewHandle | null) => {
      (livePreviewRef as any).current = instance;
      if (typeof ref === 'function') ref(instance);
      else if (ref) (ref as any).current = instance;
    };

    // Throttle streaming code updates to avoid iframe flicker
    const [throttledCode, setThrottledCode] = useState("");
    const lastUpdateRef = useRef(0);

    useEffect(() => {
      if (status !== "streaming" || !streamingCode) return;
      const now = Date.now();
      if (now - lastUpdateRef.current > 150) {
        lastUpdateRef.current = now;
        setThrottledCode(streamingCode);
      } else {
        const timer = setTimeout(() => {
          lastUpdateRef.current = Date.now();
          setThrottledCode(streamingCode);
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [streamingCode, status]);

    useEffect(() => {
      if (status !== "streaming") setThrottledCode("");
    }, [status]);

    const previewCode = status === "streaming" && throttledCode
      ? throttledCode
      : result?.component;

    return (
      <div className="h-full w-full flex flex-col" style={{ backgroundColor: "var(--scifi-bg)" }}>
        {/* Preview Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
            backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4" style={{ color: "var(--scifi-cyan)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}>
              {status === "streaming" ? "GENERATING" : "LIVE PREVIEW"}
            </span>
          </div>
          {status === "done" && result && (
            <div
              className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: editMode ? "var(--scifi-orange)" : "var(--scifi-green)",
                border: `1px solid ${editMode ? "var(--scifi-orange)" : "var(--scifi-green)"}`,
                clipPath: "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                fontFamily: "'Courier New', monospace",
              }}
            >
              {editMode ? "EDIT MODE" : "READY"}
            </div>
          )}
          {status === "streaming" && (
            <span className="text-[10px] font-semibold uppercase tracking-wider animate-pulse" style={{ color: "var(--scifi-orange)", fontFamily: "'Courier New', monospace" }}>
              GENERATING
            </span>
          )}
        </div>

        {/* Progress bar */}
        {status === "streaming" && (
          <div className="w-full h-[2px] overflow-hidden" style={{ backgroundColor: "rgba(0, 212, 255, 0.1)" }}>
            <div
              className="h-full animate-[shimmer_1.5s_ease-in-out_infinite]"
              style={{ width: "40%", background: "linear-gradient(90deg, var(--scifi-cyan), var(--scifi-orange))", boxShadow: "0 0 8px var(--scifi-cyan)" }}
            />
            <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
          </div>
        )}
        {status === "done" && (
          <div className="w-full h-[2px]" style={{ background: "var(--scifi-green)", boxShadow: "0 0 8px var(--scifi-green)" }} />
        )}

        {/* Apply edits bar */}
        {hasEdits && status === "done" && (
          <div
            className="px-3 py-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(57, 255, 20, 0.3)", backgroundColor: "rgba(57, 255, 20, 0.05)" }}
          >
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}>
              UNSAVED CHANGES
            </span>
            <button
              onClick={async () => {
                if (livePreviewRef.current && onApplyEdits) {
                  const html = await livePreviewRef.current.getSnapshot();
                  onApplyEdits(html);
                }
              }}
              className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold"
              style={{
                color: "#000", backgroundColor: "var(--scifi-green)", border: "none",
                cursor: "pointer", fontFamily: "'Courier New', monospace",
                clipPath: "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
              }}
            >
              SAVE
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence>
            {status === "processing" && <ProcessingOverlay />}
          </AnimatePresence>

          {previewCode ? (
            <LivePreview
              ref={combinedRef}
              code={previewCode}
              editMode={status === "done" && editMode}
              onElementSelected={onElementSelected}
              onElementDragged={onElementDragged}
            />
          ) : status !== "processing" ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Box className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--scifi-cyan)", opacity: 0.2 }} />
                <p className="text-xs mb-2" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  NO PREVIEW AVAILABLE
                </p>
                <p className="text-[10px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Capture or upload a sketch to see your app
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);
