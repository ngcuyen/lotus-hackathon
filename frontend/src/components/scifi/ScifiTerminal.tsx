import { ReactNode, useEffect, useRef } from "react";

interface TerminalLine {
  text: string;
  type?: "input" | "output" | "error" | "success";
  timestamp?: string;
}

interface ScifiTerminalProps {
  lines: TerminalLine[];
  title?: string;
  prompt?: string;
  height?: string;
  autoScroll?: boolean;
  showScanLine?: boolean;
  className?: string;
}

export function ScifiTerminal({
  lines,
  title = "TERMINAL",
  prompt = ">",
  height = "400px",
  autoScroll = true,
  showScanLine = true,
  className = "",
}: ScifiTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const getLineColor = (type?: string) => {
    switch (type) {
      case "input":
        return "var(--scifi-cyan)";
      case "output":
        return "var(--scifi-text)";
      case "error":
        return "#dc2626";
      case "success":
        return "var(--scifi-green)";
      default:
        return "var(--scifi-text)";
    }
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: "var(--scifi-bg)",
        border: "1px solid var(--scifi-cyan)",
        clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
        boxShadow: "0 0 20px var(--scifi-cyan)40, inset 0 0 20px var(--scifi-cyan)10",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          borderColor: "var(--scifi-cyan)40",
          backgroundColor: "var(--scifi-panel)",
        }}
      >
        <span
          className="text-xs uppercase tracking-wider font-semibold"
          style={{
            color: "var(--scifi-cyan)",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {title}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-green)", boxShadow: "0 0 6px var(--scifi-green)" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-orange)", boxShadow: "0 0 6px var(--scifi-orange)" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#dc2626", boxShadow: "0 0 6px #dc2626" }} />
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={scrollRef}
        className="relative overflow-y-auto p-4"
        style={{
          height,
          fontFamily: "'Courier New', monospace",
          fontSize: "0.875rem",
          lineHeight: "1.6",
        }}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            className="flex gap-2 mb-1"
            style={{
              color: getLineColor(line.type),
            }}
          >
            {line.timestamp && (
              <span style={{ color: "var(--scifi-text-dim)", minWidth: "80px" }}>[{line.timestamp}]</span>
            )}
            {line.type === "input" && <span style={{ color: "var(--scifi-cyan)" }}>{prompt}</span>}
            <span>{line.text}</span>
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="flex gap-2 mt-1">
          <span style={{ color: "var(--scifi-cyan)" }}>{prompt}</span>
          <span
            className="inline-block w-2 h-4"
            style={{
              backgroundColor: "var(--scifi-cyan)",
              animation: "flicker 1s infinite",
            }}
          />
        </div>

        {/* Scan line effect */}
        {showScanLine && (
          <div
            className="absolute left-0 right-0 h-0.5 pointer-events-none"
            style={{
              background: "linear-gradient(transparent, var(--scifi-cyan)80, transparent)",
              boxShadow: "0 0 8px var(--scifi-cyan)",
              animation: "scan-line 4s linear infinite",
              opacity: 0.3,
            }}
          />
        )}
      </div>

      {/* Corner bolts */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-cyan)", boxShadow: "0 0 6px var(--scifi-cyan)" }} />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-cyan)", boxShadow: "0 0 6px var(--scifi-cyan)" }} />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-cyan)", boxShadow: "0 0 6px var(--scifi-cyan)" }} />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--scifi-cyan)", boxShadow: "0 0 6px var(--scifi-cyan)" }} />
    </div>
  );
}
