import { useState, useEffect, useCallback } from "react";
import { Clock, Trash2, RefreshCw, Eye } from "lucide-react";
import { fetchGenerations, fetchGeneration, deleteGeneration, type GenerationItem } from "../api/generations";

interface HistoryPanelProps {
  onLoad: (component: string, description: string) => void;
}

export function HistoryPanel({ onLoad }: HistoryPanelProps) {
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGenerations(30);
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleLoad = async (genId: string) => {
    try {
      const full = await fetchGeneration(genId);
      if (full.component) onLoad(full.component, full.description);
    } catch {}
  };

  const handleDelete = async (genId: string) => {
    try {
      await deleteGeneration(genId);
      setItems((prev) => prev.filter((i) => i.gen_id !== genId));
    } catch {}
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--scifi-bg)" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(0, 212, 255, 0.2)" }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "var(--scifi-cyan)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
          >
            HISTORY
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5"
            style={{
              color: "var(--scifi-text-dim)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            {items.length}
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--scifi-cyan)",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {error && (
          <p className="text-[10px] text-center py-4" style={{ color: "#dc2626", fontFamily: "'Courier New', monospace" }}>
            {error}
          </p>
        )}
        {!error && items.length === 0 && !loading && (
          <p className="text-[10px] text-center py-8" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
            NO GENERATIONS YET
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.gen_id}
            style={{
              padding: "8px 10px",
              border: "1px solid rgba(0, 212, 255, 0.15)",
              clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--scifi-cyan)";
              e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.15)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {/* Description */}
            <p
              className="text-[11px] mb-1 line-clamp-2"
              style={{ color: "var(--scifi-text)", fontFamily: "'Courier New', monospace", lineHeight: 1.4 }}
            >
              {item.description}
            </p>
            {/* Meta row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] px-1 py-0.5 uppercase"
                  style={{
                    color: "var(--scifi-orange)",
                    border: "1px solid rgba(255, 106, 0, 0.3)",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {item.style}
                </span>
                {item.purpose && (
                  <span
                    className="text-[9px] px-1 py-0.5 uppercase"
                    style={{
                      color: "var(--scifi-green)",
                      border: "1px solid rgba(57, 255, 20, 0.3)",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {item.purpose}
                  </span>
                )}
                <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  {item.latency_seconds}s
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                  {timeAgo(item.created_at)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLoad(item.gen_id); }}
                  title="Load preview"
                  style={{ background: "none", border: "none", color: "var(--scifi-cyan)", cursor: "pointer", padding: "2px" }}
                >
                  <Eye className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.gen_id); }}
                  title="Delete"
                  style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: "2px" }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
