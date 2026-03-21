import { useState, useCallback, useRef } from "react";
import { generateFromSketch, generateFromSketchStream, type GenerateResponse } from "../api/generate";
import { saveGeneration } from "../api/generations";

type Status = "idle" | "processing" | "analyzing" | "designing" | "streaming" | "done" | "error";

interface Latency {
  ai: number;
  render: number;
  total: number;
}

interface UseSketchToAppReturn {
  generate: (imageBase64: string, modification?: string, style?: string, purpose?: string, customGuidelines?: string) => Promise<void>;
  loadMockData: () => void;
  loadResult: (component: string, description: string) => void;
  result: GenerateResponse | null;
  streamingCode: string;
  status: Status;
  error: string | null;
  latency: Latency | null;
  reset: () => void;
  sessionId: string;
  currentVersion: number;
  currentGenId: string | null;
  bumpVersion: () => number;
}

/**
 * Extract the "component" value from a partially streamed JSON string.
 */
function extractPartialComponent(raw: string): string | null {
  const marker = '"component"';
  const idx = raw.indexOf(marker);
  if (idx === -1) return null;

  const afterMarker = raw.indexOf(':', idx + marker.length);
  if (afterMarker === -1) return null;

  let start = afterMarker + 1;
  while (start < raw.length && (raw[start] === ' ' || raw[start] === '\n')) start++;
  if (raw[start] !== '"') return null;
  start++;

  let result = "";
  let i = start;
  while (i < raw.length) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === 'n') result += '\n';
      else if (next === 't') result += '\t';
      else if (next === '"') result += '"';
      else if (next === '\\') result += '\\';
      else result += next;
      i += 2;
    } else if (raw[i] === '"') {
      break;
    } else {
      result += raw[i];
      i++;
    }
  }

  return result || null;
}

/**
 * Auto-close partial JSX/JS code so Babel can compile it.
 */
function autoCloseCode(code: string): string | null {
  if (!code.includes("return")) return null;

  // Strip import lines — they're handled by iframe CDN globals
  let result = code.split('\n').filter(l => !l.trim().startsWith('import ')).join('\n');

  // Recharts components are too complex to auto-close mid-stream.
  // If we're inside an unclosed recharts block, skip rendering this frame.
  const CHART_TAGS = ['ResponsiveContainer', 'LineChart', 'BarChart', 'PieChart', 'AreaChart', 'RadialBarChart'];
  for (const tag of CHART_TAGS) {
    const opens = (result.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const closes = (result.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (opens > closes) return null; // mid-chart, skip this frame
  }

  let braces = 0, parens = 0;
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (inString) {
      if (ch === stringChar && result[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; continue; }
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
  }

  const openTags: string[] = [];
  const tagRegex = /<\/?([A-Za-z][A-Za-z0-9.]*)[^>]*\/?>/g;
  let match;
  while ((match = tagRegex.exec(result)) !== null) {
    const full = match[0];
    const tagName = match[1];
    if (full.endsWith('/>')) continue;
    if (full.startsWith('</')) {
      const idx = openTags.lastIndexOf(tagName);
      if (idx !== -1) openTags.splice(idx, 1);
    } else {
      openTags.push(tagName);
    }
  }

  const lastOpenBracket = result.lastIndexOf('<');
  if (lastOpenBracket !== -1) {
    const afterBracket = result.slice(lastOpenBracket);
    if (!afterBracket.includes('>')) {
      result += ' />';
    }
  }

  for (let i = openTags.length - 1; i >= 0; i--) {
    result += `</${openTags[i]}>`;
  }

  result += ')'.repeat(Math.max(0, parens));
  result += '}'.repeat(Math.max(0, braces));

  return result;
}

export function useSketchToApp(): UseSketchToAppReturn {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [streamingCode, setStreamingCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<Latency | null>(null);
  const previousCodeRef = useRef<string | null>(null);
  const sessionIdRef = useRef(localStorage.getItem("sketch2app_session") || (() => { const id = crypto.randomUUID(); localStorage.setItem("sketch2app_session", id); return id; })());
  const currentVersionRef = useRef(0);
  const currentGenIdRef = useRef<string | null>(null);

  const generate = useCallback(async (imageBase64: string, modification?: string, style?: string, purpose?: string, customGuidelines?: string) => {
    setStatus("processing");
    setError(null);
    setStreamingCode("");
    setResult(null);
    const startTime = performance.now();

    try {
      const request = {
        image_base64: imageBase64,
        previous_code: previousCodeRef.current || undefined,
        modification,
        style,
        purpose,
        custom_guidelines: customGuidelines,
        session_id: sessionIdRef.current,
      };

      let fullRaw = "";
      let firstToken = true;

      const response = await generateFromSketchStream(request, (token) => {
        // Check for SSE status events from pipeline
        if (token.startsWith("data: ")) {
          try {
            const evt = JSON.parse(token.replace("data: ", "").trim());
            if (evt.status === "analyzing") { setStatus("analyzing"); return; }
            if (evt.status === "designing") { setStatus("designing"); return; }
            if (evt.status === "generating") { setStatus("processing"); return; }
          } catch {}
        }

        fullRaw += token;
        const partial = extractPartialComponent(fullRaw);
        if (partial) {
          const renderable = autoCloseCode(partial);
          if (renderable) {
            if (firstToken) {
              firstToken = false;
              setStatus("streaming");
            }
            setStreamingCode(renderable);
          }
        }
      });

      const aiTime = performance.now() - startTime;
      const renderStart = performance.now();

      setResult(response);
      setStreamingCode("");
      previousCodeRef.current = response.component;

      // Save to DynamoDB
      try {
        const saved = await saveGeneration({
          component: response.component,
          description: response.description,
          style,
          purpose,
          session_id: sessionIdRef.current,
          modification,
          latency_seconds: aiTime / 1000,
          version: 1,
        });
        response.gen_id = saved.gen_id;
        currentVersionRef.current = 1;
        currentGenIdRef.current = saved.gen_id;
      } catch {}

      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        setLatency({
          ai: aiTime / 1000,
          render: renderTime / 1000,
          total: (aiTime + renderTime) / 1000,
        });
        setStatus("done");
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error("[ERROR]", message);
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStreamingCode("");
    setStatus("idle");
    setError(null);
    setLatency(null);
    previousCodeRef.current = null;
  }, []);

  const loadMockData = useCallback(() => {
    const mockResult: GenerateResponse = {
      component: `import { useState } from 'react';
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome Back</h1>
        <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold">Sign In</button>
      </div>
    </div>
  );
}`,
      description: "Login form"
    };
    setResult(mockResult);
    previousCodeRef.current = mockResult.component;
    setLatency({ ai: 3.5, render: 0.2, total: 3.7 });
    setStatus("done");
  }, []);

  const loadResult = useCallback((component: string, description: string) => {
    setStreamingCode("");
    setResult({ component, description });
    previousCodeRef.current = component;
    setStatus("done");
  }, []);

  return {
    generate, loadMockData, loadResult, result, streamingCode, status, error, latency, reset,
    sessionId: sessionIdRef.current,
    currentVersion: currentVersionRef.current,
    currentGenId: currentGenIdRef.current,
    bumpVersion: () => { currentVersionRef.current += 1; return currentVersionRef.current; },
  };
}
