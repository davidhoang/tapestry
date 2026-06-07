import { QueryCache, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { toast } from "@/hooks/use-toast";

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

export interface ApiErrorBody {
  error?: string;
  message?: string;
  requestId?: string | number;
  code?: string;
  table?: string;
  column?: string;
  detail?: string;
  pgCode?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  requestId?: string | number;
  code?: string;
  errorKind?: string;
  body: ApiErrorBody | null;

  constructor(status: number, statusText: string, body: ApiErrorBody | null, fallbackText: string) {
    const message =
      (body && typeof body.message === "string" && body.message) ||
      fallbackText ||
      `${status} ${statusText}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.requestId = body?.requestId;
    this.code = body?.code ?? body?.pgCode;
    this.errorKind = body?.error;
  }

  get isSchemaMismatch(): boolean {
    return this.errorKind === "database_schema_mismatch";
  }
}

async function readErrorBody(res: Response): Promise<{ body: ApiErrorBody | null; text: string }> {
  const text = await res.text().catch(() => "");
  if (!text) return { body: null, text: "" };
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        return { body: parsed as ApiErrorBody, text };
      }
    } catch {
      // fall through
    }
  }
  return { body: null, text };
}

async function throwApiError(res: Response): Promise<never> {
  const { body, text } = await readErrorBody(res);
  throw new ApiError(res.status, res.statusText, body, text || res.statusText);
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
    await throwApiError(response);
  }

  return response.json();
}

function describeError(err: unknown): { title: string; description: string } | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status < 500) return null;

  if (err.isSchemaMismatch) {
    const where =
      err.body?.table && err.body?.column
        ? ` (${err.body.table}.${err.body.column})`
        : err.body?.table
          ? ` (${err.body.table})`
          : "";
    const idSuffix = err.requestId ? ` (id: ${err.requestId})` : "";
    return {
      title: "Database is out of sync",
      description: `The production schema is missing fields this app needs${where}. Re-publish the app to apply pending migrations.${idSuffix}`,
    };
  }

  const idSuffix = err.requestId ? ` (id: ${err.requestId})` : "";
  return {
    title: "Something went wrong",
    description: `${err.message}${idSuffix}. Please retry or contact support.`,
  };
}

function reportApiErrorToMonitoring(err: unknown, context: "query" | "mutation") {
  if (!(err instanceof ApiError)) return;
  if (err.status < 500) return;
  try {
    if (err.requestId !== undefined) {
      Sentry.addBreadcrumb({
        category: "api",
        type: "http",
        level: "error",
        message: `API ${err.status} (request id ${err.requestId})`,
        data: {
          status: err.status,
          requestId: err.requestId,
          errorKind: err.errorKind,
          pgCode: err.code,
        },
      });
    }
    Sentry.captureException(err, {
      tags: {
        source: "api",
        context,
        status: String(err.status),
        errorKind: err.errorKind ?? "unknown",
        ...(err.code ? { pgCode: err.code } : {}),
        ...(err.requestId !== undefined ? { requestId: String(err.requestId) } : {}),
      },
      contexts: {
        api: {
          status: err.status,
          statusText: err.statusText,
          requestId: err.requestId,
          errorKind: err.errorKind,
          pgCode: err.code,
          message: err.message,
        },
      },
    });
  } catch {
    // never let monitoring break the app
  }
}

const recentErrorToasts = new Map<string, number>();
const ERROR_TOAST_DEDUP_MS = 4000;

function showErrorToast(err: unknown) {
  const desc = describeError(err);
  if (!desc) return;
  const key = `${desc.title}::${desc.description}`;
  const now = Date.now();
  const last = recentErrorToasts.get(key);
  if (last && now - last < ERROR_TOAST_DEDUP_MS) return;
  recentErrorToasts.set(key, now);
  toast({
    variant: "destructive",
    title: desc.title,
    description: desc.description,
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      reportApiErrorToMonitoring(error, "query");
      showErrorToast(error);
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          headers: authHeaders,
        });

        if (!res.ok) {
          await throwApiError(res);
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
      onError: (error) => {
        reportApiErrorToMonitoring(error, "mutation");
        showErrorToast(error);
      },
    },
  },
});
