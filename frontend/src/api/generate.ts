// ─── API Configuration ───
const API_BASE = import.meta.env.VITE_API_URL || "";

export interface GenerateRequest {
  image_base64: string;
  previous_code?: string;
  modification?: string;
  style?: string;
  purpose?: string;
  session_id?: string;
  custom_guidelines?: string;
}

export interface GenerateResponse {
  component: string;
  description: string;
  gen_id?: string;
}

export async function generateFromSketch(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Generation failed: ${error}`);
  }
  return response.json();
}

/**
 * Streaming version — SSE status events first, then raw code tokens.
 * Status events: lines starting with "data: " followed by \n\n
 * Code tokens: everything after the last status event
 */
export async function generateFromSketchStream(
  request: GenerateRequest,
  onToken: (token: string) => void
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/api/generate-stream`, {
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
  let codeStarted = false;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      if (!codeStarted) {
        // Before code starts, check for SSE status lines
        // SSE lines end with \n\n, code doesn't start with "data: "
        let remaining = chunk;
        while (remaining.length > 0) {
          const sseEnd = remaining.indexOf("\n\n");
          if (sseEnd !== -1) {
            const line = remaining.slice(0, sseEnd).trim();
            remaining = remaining.slice(sseEnd + 2);
            if (line.startsWith("data: ")) {
              onToken(line); // SSE status event
            } else if (line) {
              // First code chunk
              codeStarted = true;
              fullText += line + remaining;
              onToken(line + remaining);
              remaining = "";
            }
          } else {
            // No \n\n found — either partial SSE or start of code
            if (remaining.startsWith("data: ")) {
              // Partial SSE, wait for more
              // Put back — but we can't, so just skip
              break;
            } else if (remaining.trim()) {
              codeStarted = true;
              fullText += remaining;
              onToken(remaining);
            }
            remaining = "";
          }
        }
      } else {
        // Code phase — pass through directly
        fullText += chunk;
        onToken(chunk);
      }
    }
  }

  try {
    const parsed = JSON.parse(fullText);
    return parsed;
  } catch {
    return { component: fullText, description: "Generated component" };
  }
}
