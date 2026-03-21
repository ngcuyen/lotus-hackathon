import { useState, useCallback, useRef } from "react";
import { generateFromSketch, type GenerateResponse } from "../api/generate";

type Status = "idle" | "processing" | "done" | "error";

interface Latency {
  ai: number;
  render: number;
  total: number;
}

interface UseSketchToAppReturn {
  generate: (imageBase64: string, modification?: string, style?: string) => Promise<void>;
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

  const generate = useCallback(async (imageBase64: string, modification?: string, style?: string) => {
    setStatus("processing");
    setError(null);
    const startTime = performance.now();
    console.log("[1/4] Starting generation, image size:", imageBase64.length, "chars, style:", style);

    try {
      console.log("[2/4] Calling API...");
      const response = await generateFromSketch({
        image_base64: imageBase64,
        previous_code: previousCodeRef.current || undefined,
        modification,
        style,
      });

      const aiTime = performance.now() - startTime;
      console.log("[3/4] API responded in", (aiTime / 1000).toFixed(2) + "s");
      console.log("[3/4] Description:", response.description);
      console.log("[3/4] Component length:", response.component?.length, "chars");
      console.log("[3/4] Component preview:", response.component?.substring(0, 200));
      const renderStart = performance.now();

      setResult(response);
      previousCodeRef.current = response.component;

      // Small delay to measure render time
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        console.log("[4/4] Render time:", (renderTime / 1000).toFixed(2) + "s");
        setLatency({
          ai: aiTime / 1000,
          render: renderTime / 1000,
          total: (aiTime + renderTime) / 1000,
        });
        setStatus("done");
        console.log("[4/4] Status: done ✅");
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
    setStatus("idle");
    setError(null);
    setLatency(null);
    previousCodeRef.current = null;
  }, []);

  return { generate, result, status, error, latency, reset };
}
