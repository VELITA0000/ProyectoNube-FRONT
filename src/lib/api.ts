/**
 * HTTP client for the backend (local Express or API Gateway + Lambda).
 * Set `VITE_API_BASE_URL` in `APP/.env` (e.g. http://localhost:4000 or terraform output http_api_endpoint).
 *
 * Auth: Cognito ID token in `Authorization: Bearer`.
 */

export const TOKEN_STORAGE_KEY = "lumiere.idToken";

function getBaseUrl(): string {
  const u = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!u) {
    throw new Error(
      "Missing VITE_API_BASE_URL. Create APP/.env with the API URL (see .env.example).",
    );
  }
  return u.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
