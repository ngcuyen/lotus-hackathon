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

export async function fetchGenerations(limit = 50): Promise<GenerationItem[]> {
  const res = await fetch(`${API_BASE}/generations?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch generations");
  return res.json();
}

export async function fetchGeneration(genId: string): Promise<GenerationItem> {
  const res = await fetch(`${API_BASE}/generations/${genId}`);
  if (!res.ok) throw new Error("Generation not found");
  return res.json();
}

export async function deleteGeneration(genId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/generations/${genId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}
