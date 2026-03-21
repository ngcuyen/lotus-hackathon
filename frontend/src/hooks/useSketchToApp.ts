import { useState, useCallback, useRef } from "react";
import { generateFromSketch, type GenerateResponse } from "../api/generate";

type Status = "idle" | "processing" | "done" | "error";

interface Latency {
  ai: number;
  render: number;
  total: number;
}

interface UseSketchToAppReturn {
  generate: (imageBase64: string, modification?: string) => Promise<void>;
  result: GenerateResponse | null;
  status: Status;
  error: string | null;
  latency: Latency | null;
  reset: () => void;
}

/**
 * useSketchToApp manages the entire generation lifecycle:
 * 1. Send sketch image to backend
 * 2. Track processing status
 * 3. Receive generated code
 * 4. Measure latency for display
 */
export function useSketchToApp(): UseSketchToAppReturn {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<Latency | null>(null);
  const previousCodeRef = useRef<string | null>(null);

  const generate = useCallback(async (imageBase64: string, modification?: string) => {
    setStatus("processing");
    setError(null);
    const startTime = performance.now();

    try {
      const response = await generateFromSketch({
        image_base64: imageBase64,
        previous_code: previousCodeRef.current || undefined,
        modification,
      });

      const aiTime = performance.now() - startTime;
      const renderStart = performance.now();

      setResult(response);
      previousCodeRef.current = response.component;

      // Small delay to measure render time
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
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus("idle");
    setError(null);
    setLatency(null);
    previousCodeRef.current = null;
  }, []);

  return { generate, result, status, error, latency, reset };
}
