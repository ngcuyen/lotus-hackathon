// ─── API Configuration ───
// In development, requests proxy to localhost:4000 via Vite config.
// In production, set this to your API Gateway URL.
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface GenerateRequest {
  image_base64: string;
  previous_code?: string;
  modification?: string;
  style?: string;
  purpose?: string;
}

export interface GenerateResponse {
  component: string;    // Generated React + Tailwind code
  description: string;  // Human-readable description of what was detected
}

/**
 * Call the backend to generate React code from a sketch image.
 */
export async function generateFromSketch(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Generation failed: ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Streaming version — receives code token by token.
 * Use this for the "code appearing character by character" effect.
 */
export async function generateFromSketchStream(
  request: GenerateRequest,
  onToken: (token: string) => void
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onToken(chunk);
    }
  }

  // Parse the final complete response
  try {
    const parsed = JSON.parse(fullText);
    return parsed;
  } catch {
    // If streaming returned raw code (not JSON), wrap it
    return {
      component: fullText,
      description: "Generated component",
    };
  }
}
