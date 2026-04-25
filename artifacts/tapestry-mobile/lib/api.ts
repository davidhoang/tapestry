import Constants from "expo-constants";

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  role: string;
  isDefault: boolean;
};

export type Designer = {
  id: number;
  name: string;
  title: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  linkedIn: string | null;
  website: string | null;
  photoUrl: string | null;
  skills: string[];
  description: string | null;
  available: boolean | null;
  createdAt: string;
};

export type DesignerDetails = Designer & {
  level: string | null;
  phoneNumber: string | null;
  notes: string | null;
  enrichedAt: string | null;
  enrichmentSource: string | null;
  timelineEventCount: number;
};

export type TimelineEvent = {
  id: number;
  eventType: string;
  summary: string;
  source: string | null;
  details: unknown;
  createdAt: string;
};

export type ListSummary = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  designerCount: number;
};

export type MobileUser = {
  id: number;
  email: string;
  isAdmin: boolean;
  createdAt: string;
};

function getApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`.replace(/\/+$/, "");

  // Fallback for Expo Go — read host from manifest
  const debuggerHost = Constants.expoConfig?.hostUri ?? "";
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `http://${host}:8080`;
  }
  return "";
}

export const API_BASE = getApiBase();

type RequestInit = Parameters<typeof fetch>[1];

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { token, query, headers, ...rest } = options;

  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (rest.body && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), { ...rest, headers: finalHeaders });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }
    const message =
      typeof body === "object" && body && "error" in body && typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed: ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
