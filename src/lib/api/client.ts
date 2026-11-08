import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export function isApiEnabled(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Add it to liquorflow-dashboard-main/.env (see .env.example), then restart npm run dev.",
    );
  }
  return base.replace(/\/$/, "");
}

async function getAuthToken(forceRefresh = false): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ApiAuthError("Not authenticated");
  }

  return user.getIdToken(forceRefresh);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const token = await getAuthToken(false);
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the LiquorFlow API. Start the backend (cd backend → npm run dev) and confirm http://localhost:5000/health returns OK.",
    );
  }

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await getAuthToken(true);
    let retry: Response;
    try {
      retry = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
          ...(options.headers ?? {}),
        },
      });
    } catch {
      throw new Error(
        "Cannot reach the LiquorFlow API. Start the backend (cd backend → npm run dev) and confirm http://localhost:5000/health returns OK.",
      );
    }
    return parseApiResponse<T>(retry);
  }

  return parseApiResponse<T>(response);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new ApiAuthError("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
