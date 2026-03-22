import { useRef, useState, useEffect, forwardRef } from "react";
import { Box, Globe, Copy, Check, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { LivePreview, type LivePreviewHandle } from "./LivePreview";
import { ProcessingOverlay } from "./ProcessingOverlay";

interface PreviewPanelProps {
  result: any;
  status: "idle" | "processing" | "analyzing" | "designing" | "streaming" | "done" | "error";
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
    const [publishing, setPublishing] = useState(false);
    const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!livePreviewRef.current || publishing) return;
                  setPublishing(true);
                  try {
                    const html = await livePreviewRef.current.getSnapshot();
                    const resp = await fetch("/api/publish", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ html, gen_id: result?.gen_id }),
                    });
                    const data = await resp.json();
                    if (data.url) setPublishedUrl(data.url);
                  } catch (e) {
                    console.error("Publish failed:", e);
                  } finally {
                    setPublishing(false);
                  }
                }}
                disabled={publishing}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: "#000",
                  backgroundColor: "var(--scifi-green)",
                  border: "none",
                  cursor: publishing ? "wait" : "pointer",
                  fontFamily: "'Courier New', monospace",
                  clipPath: "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                  opacity: publishing ? 0.6 : 1,
                }}
              >
                <Globe className="w-3 h-3" />
                {publishing ? "PUBLISHING..." : "PUBLISH"}
              </button>
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
            {(status === "processing" || status === "analyzing" || status === "designing") && <ProcessingOverlay status={status} />}
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
            <div
              className="h-full flex items-center justify-center"
              style={{
                backgroundImage: "url('/background.svg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="text-center flex flex-col items-center" style={{ animation: "fadeInUp 0.6s ease-out" }}>
                <video
                  src="/demo.mov"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    maxWidth: "90%",
                    maxHeight: "70%",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    boxShadow: "0 0 30px rgba(0, 212, 255, 0.1)"
                  }}
                />
                <p className="text-sm mt-4 font-semibold" style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}>
                  Your app will appear here
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  Sketch it → Capture it → Watch it come alive
                </p>
                <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              </div>
            </div>
          ) : null}
        </div>
        {/* Publish Modal */}
        {publishedUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="p-6 max-w-md w-full mx-4 relative"
              style={{
                backgroundColor: "var(--scifi-bg)",
                border: "1px solid var(--scifi-green)",
                boxShadow: "0 0 30px rgba(57, 255, 20, 0.2)",
              }}
            >
              <button
                onClick={() => { setPublishedUrl(null); setCopied(false); }}
                className="absolute top-3 right-3"
                style={{ color: "var(--scifi-text-dim)", background: "none", border: "none", cursor: "pointer" }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-4">
                <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--scifi-green)" }} />
                <div
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}
                >
                  PUBLISHED
                </div>
              </div>

              {/* URL + Copy */}
              <div
                className="flex items-center gap-2 p-2 mb-4"
                style={{ backgroundColor: "rgba(57, 255, 20, 0.05)", border: "1px solid rgba(57, 255, 20, 0.2)" }}
              >
                <input
                  readOnly
                  value={publishedUrl}
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: "var(--scifi-green)", fontFamily: "'Courier New', monospace" }}
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(publishedUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ color: "var(--scifi-green)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publishedUrl)}&bgcolor=0a0a0f&color=39ff14`}
                  alt="QR Code"
                  width={180}
                  height={180}
                  style={{ border: "1px solid rgba(57, 255, 20, 0.3)" }}
                />
              </div>

              <p
                className="text-center text-[10px] mt-3 uppercase tracking-wider"
                style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}
              >
                Scan to open on any device
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
