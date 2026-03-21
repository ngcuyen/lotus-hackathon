const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface CustomStyleData {
  colorPrimary?: string;
  colorSecondary?: string;
  fontFamily?: string;
  borderRadius?: string;
  spacing?: string;
  shadows?: boolean;
  [key: string]: any; // Allow additional custom properties
}

export interface CustomStyle {
  id: string;
  name: string;
  description: string;
  data: CustomStyleData;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveStyleRequest {
  userId?: string;
  style: CustomStyle;
}

export interface SaveStyleResponse {
  success: boolean;
  styleId: string;
  message: string;
}

export interface ListStylesResponse {
  styles: CustomStyle[];
}

export interface DeleteStyleResponse {
  success: boolean;
  message: string;
}

/**
 * Save a new custom style.
 */
export async function saveCustomStyle(
  style: CustomStyle,
  userId: string = "default"
): Promise<SaveStyleResponse> {
  const response = await fetch(`${API_BASE}/api/styles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, style }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save style: ${error}`);
  }

  return response.json();
}

/**
 * List all custom styles for a user.
 */
export async function listCustomStyles(userId: string = "default"): Promise<ListStylesResponse> {
  const response = await fetch(`${API_BASE}/api/styles?userId=${userId}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list styles: ${error}`);
  }

  return response.json();
}

/**
 * Delete a custom style.
 */
export async function deleteCustomStyle(
  styleId: string,
  userId: string = "default"
): Promise<DeleteStyleResponse> {
  const response = await fetch(`${API_BASE}/api/styles/${styleId}?userId=${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete style: ${error}`);
  }

  return response.json();
}
