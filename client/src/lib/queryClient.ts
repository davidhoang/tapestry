import { QueryClient } from "@tanstack/react-query";

interface ApiRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  workspaceSlug?: string;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const { method = "GET", body, headers = {}, workspaceSlug } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
    credentials: "include",
  };

  // Add workspace slug header if provided
  if (workspaceSlug && workspaceSlug.length > 0) {
    requestHeaders["x-workspace-slug"] = workspaceSlug;
  }

  // Add content-type for requests with body
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
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
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
