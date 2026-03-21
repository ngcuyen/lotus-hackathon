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
  loadMockData: () => void;
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

  const loadMockData = useCallback(() => {
    const mockResult: GenerateResponse = {
      component: `import { useState } from 'react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <button className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg">
              Sign In
            </button>

            <p className="text-center text-sm text-blue-600 hover:underline cursor-pointer">
              Forgot password?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}`,
      description: "Login form with email and password inputs"
    };

    setResult(mockResult);
    previousCodeRef.current = mockResult.component;
    setLatency({
      ai: 3.5,
      render: 0.2,
      total: 3.7,
    });
    setStatus("done");
    console.log("✅ Mock data loaded successfully");
  }, []);

  return { generate, loadMockData, result, status, error, latency, reset };
}
