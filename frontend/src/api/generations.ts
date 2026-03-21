const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface GenerationItem {
  gen_id: string;
  created_at: string;
  style: string;
  purpose?: string;
  description: string;
  latency_seconds: number;
  modification?: string;
  component?: string; // only in detail response
}

export async function fetchGenerations(limit = 50, sessionId?: string): Promise<GenerationItem[]> {
  let url = `${API_BASE}/generations?limit=${limit}`;
  if (sessionId) url += `&session_id=${sessionId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch generations");
  return res.json();
}

export async function fetchGeneration(genId: string): Promise<GenerationItem> {
  const res = await fetch(`${API_BASE}/generations/${genId}`);
  if (!res.ok) throw new Error("Generation not found");
  return res.json();
}

export async function saveGeneration(data: {
  component: string;
  description: string;
  style?: string;
  purpose?: string;
  session_id?: string;
  modification?: string;
  latency_seconds?: number;
  version?: number;
  parent_gen_id?: string;
}): Promise<GenerationItem> {
  const res = await fetch(`${API_BASE}/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save generation");
  return res.json();
}

export async function deleteGeneration(genId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/generations/${genId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}
