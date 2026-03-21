import { useEffect, useRef } from "react";

interface StreamingCodeViewProps {
  code: string;
}

export function StreamingCodeView({ code }: StreamingCodeViewProps) {
  const containerRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom as code streams in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [code]);

  return (
    <div className="h-full w-full relative" style={{ backgroundColor: "#0a0e14" }}>
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.015) 2px, rgba(0, 212, 255, 0.015) 4px)",
        }}
      />

      {/* Header bar */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(0, 212, 255, 0.15)" }}
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--scifi-orange)" }} />
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "var(--scifi-orange)", fontFamily: "'Courier New', monospace" }}
        >
          AI OUTPUT STREAM
        </span>
        <span
          className="text-[10px] ml-auto"
          style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}
        >
          {code.length} CHARS
        </span>
      </div>

      {/* Code content */}
      <pre
        ref={containerRef}
        className="p-4 overflow-auto"
        style={{
          height: "calc(100% - 36px)",
          color: "var(--scifi-green)",
          fontFamily: "'Courier New', monospace",
          fontSize: "0.75rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {code}
        <span className="animate-pulse" style={{ color: "var(--scifi-cyan)" }}>|</span>
      </pre>
    </div>
  );
}
