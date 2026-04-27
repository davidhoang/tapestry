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

export type PortfolioProject = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  coverImageUrl: string | null;
  projectUrl: string | null;
  isFeatured: boolean;
  role: string | null;
  duration: string | null;
  clientName: string | null;
  projectDate: string | null;
};

export type PortfolioMediaItem = {
  id: number;
  projectId: number | null;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
};

export type PortfolioResponse = {
  portfolio: {
    id: number;
    title: string;
    tagline: string | null;
    description: string | null;
    theme: string | null;
    primaryColor: string | null;
    socialLinks: Record<string, string | undefined> | null;
    contactInfo: Record<string, unknown> | null;
  } | null;
  projects: PortfolioProject[];
  media: PortfolioMediaItem[];
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return trimTrailingSlash(withScheme);
}

/**
 * Resolves the base URL for the api-server in this order:
 *   1. EXPO_PUBLIC_API_URL  — explicit override, required for native production
 *      builds where there is no current window.origin.
 *   2. expo.extra.apiUrl    — same value baked into app.json's `extra` block by
 *      EAS / build pipelines that prefer config over env vars.
 *   3. EXPO_PUBLIC_DOMAIN   — set by the local dev script to the Replit dev
 *      domain so dev runs against the live api-server workflow.
 *   4. window.location.origin — for the web bundle (dev preview and any
 *      production web export deployed alongside api-server on the same host).
 *   5. Expo Go packager hostUri — native dev fallback (talks to the dev
 *      api-server on port 8080 over LAN).
 *
 * If none of these are available we throw at first request so the failure is
 * loud and actionable rather than producing silent 404s against an empty URL.
 */
function getApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return normalizeOrigin(explicit);

  const extraApiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (extraApiUrl) return normalizeOrigin(extraApiUrl);

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return normalizeOrigin(domain);

  if (typeof window !== "undefined" && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

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

  if (!API_BASE) {
    throw new ApiError(
      "Tapestry Mobile is not configured to reach the api-server. Set EXPO_PUBLIC_API_URL (or expo.extra.apiUrl in app.json) to your deployed api-server URL.",
      0,
      null,
    );
  }

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
