import { useState, useCallback, useRef } from "react";
import { generateFromSketch, type GenerateResponse } from "../api/generate";

type Status = "idle" | "processing" | "done" | "error";
export type AgentStep = "analyzing" | "generating" | null;

interface Latency {
  ai: number;
  render: number;
  total: number;
}

interface UseSketchToAppReturn {
  generate: (imageBase64: string, modification?: string, style?: string, purpose?: string) => Promise<void>;
  result: GenerateResponse | null;
  status: Status;
  agentStep: AgentStep;
  error: string | null;
  latency: Latency | null;
  reset: () => void;
}

// Backend step 1 (analysis) typically takes 2-4s.
// We switch to "generating" after this delay so the overlay stays in sync.
const ANALYSIS_PHASE_MS = 3500;

export function useSketchToApp(): UseSketchToAppReturn {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [agentStep, setAgentStep] = useState<AgentStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<Latency | null>(null);
  const previousCodeRef = useRef<string | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = useCallback(async (imageBase64: string, modification?: string, style?: string, purpose?: string) => {
    setStatus("processing");
    setError(null);
    setAgentStep("analyzing");

    // Schedule switch to "generating" phase
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    // Text-only modifications skip analysis step — jump straight to generating
    const isTextOnly = !!(previousCodeRef.current && modification && !imageBase64);
    if (isTextOnly) {
      setAgentStep("generating");
    } else {
      stepTimerRef.current = setTimeout(() => setAgentStep("generating"), ANALYSIS_PHASE_MS);
    }

    const startTime = performance.now();
    console.log("[AGENT] Starting, image:", imageBase64.length, "chars | style:", style, "| purpose:", purpose);

    try {
      const response = await generateFromSketch({
        image_base64: imageBase64,
        previous_code: previousCodeRef.current || undefined,
        modification,
        style,
        purpose,
      });

      const aiTime = performance.now() - startTime;
      console.log("[AGENT] API done in", (aiTime / 1000).toFixed(2) + "s");
      console.log("[AGENT] Description:", response.description);
      console.log("[AGENT] Component length:", response.component?.length, "chars");

      const renderStart = performance.now();
      setResult(response);
      previousCodeRef.current = response.component;

      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        setLatency({
          ai: aiTime / 1000,
          render: renderTime / 1000,
          total: (aiTime + renderTime) / 1000,
        });
        setAgentStep(null);
        setStatus("done");
        console.log("[AGENT] Done ✅");
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error("[AGENT ERROR]", message);
      setError(message);
      setAgentStep(null);
      setStatus("error");
    } finally {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus("idle");
    setAgentStep(null);
    setError(null);
    setLatency(null);
    previousCodeRef.current = null;
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  return { generate, result, status, agentStep, error, latency, reset };
}
