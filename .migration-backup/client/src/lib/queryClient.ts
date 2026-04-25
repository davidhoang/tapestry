import { QueryClient } from "@tanstack/react-query";

// Module-level token provider — set by ClerkTokenSync in main.tsx
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!_getToken) return {};
  try {
    const token = await _getToken();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore token errors
  }
  return {};
}

interface ApiRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  workspaceSlug?: string;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const { method = "GET", body, headers = {}, workspaceSlug } = options;

  const authHeaders = await getAuthHeaders();

  const requestHeaders: Record<string, string> = {
    ...authHeaders,
    ...headers,
  };

  if (workspaceSlug && workspaceSlug.length > 0) {
    requestHeaders["x-workspace-slug"] = workspaceSlug;
  }

  if (body && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          headers: authHeaders,
        });

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});
