const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface PanelSettings {
  panelOpacity: number;
  panelBlur: number;
  borderGlow: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  colorScheme: "cyan" | "orange" | "purple" | "green";
  fontSize: "small" | "medium" | "large";
  spacing: "compact" | "normal" | "spacious";
}

export interface PanelSettingsResponse {
  settings: PanelSettings;
  updatedAt: string | null;
  isDefault?: boolean;
}

export async function getPanelSettings(userId: string = "default"): Promise<PanelSettingsResponse> {
  const response = await fetch(`${API_BASE}/settings/panel?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to load panel settings");
  return response.json();
}

export async function savePanelSettings(
  settings: PanelSettings,
  userId: string = "default"
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/settings/panel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, settings }),
  });
  if (!response.ok) throw new Error("Failed to save panel settings");
  return response.json();
}

export async function resetPanelSettings(userId: string = "default"): Promise<{
  success: boolean;
  settings: PanelSettings;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/settings/panel/reset?userId=${userId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to reset panel settings");
  return response.json();
}
