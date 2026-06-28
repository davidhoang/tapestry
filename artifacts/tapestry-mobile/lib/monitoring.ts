import * as Sentry from "@sentry/react-native";

let initialized = false;

/**
 * Initialize crash/error reporting for the mobile app. No-op unless
 * EXPO_PUBLIC_SENTRY_DSN is set, so local dev without a DSN stays silent.
 * Unhandled JS errors and native crashes are captured automatically once
 * Sentry.init has run.
 */
export function initMonitoring() {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
      (__DEV__ ? "development" : "production"),
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });

  initialized = true;
}

export function isMonitoringEnabled() {
  return initialized;
}

/**
 * Attach (or clear) the signed-in user on error reports. We send only the
 * stable user id — no email or name — to keep PII out of monitoring.
 */
export function setMonitoringUser(user: { id: string | number } | null) {
  if (!initialized) return;
  Sentry.setUser(user ? { id: String(user.id) } : null);
}

/**
 * Tag error reports with the active workspace so issues can be grouped and
 * filtered by workspace in Sentry. Pass null to clear (e.g. on sign-out).
 */
export function setMonitoringWorkspace(slug: string | null) {
  if (!initialized) return;
  Sentry.setTag("workspace", slug ?? undefined);
}

// React Query retries failed requests, so a single outage can call
// captureApiError several times in quick succession. De-duplicate by
// {path,status} within a short window so each failure reports once.
const recentApiErrors = new Map<string, number>();
const API_ERROR_DEDUP_MS = 10_000;

/**
 * Report a server-side (5xx) API failure to monitoring, mirroring the web
 * app so backend errors surfaced on mobile land in the same Sentry project.
 */
export function captureApiError(
  err: unknown,
  context: { status: number; path?: string; body?: unknown },
) {
  if (!initialized) return;
  if (context.status < 500) return;

  const key = `${context.status}::${context.path ?? "unknown"}`;
  const now = Date.now();
  const last = recentApiErrors.get(key);
  if (last !== undefined && now - last < API_ERROR_DEDUP_MS) return;
  recentApiErrors.set(key, now);
  if (recentApiErrors.size > 100) {
    for (const [k, ts] of recentApiErrors) {
      if (now - ts >= API_ERROR_DEDUP_MS) recentApiErrors.delete(k);
    }
  }

  try {
    Sentry.captureException(err, {
      tags: {
        source: "api",
        platform: "mobile",
        status: String(context.status),
      },
      contexts: {
        api: {
          status: context.status,
          path: context.path,
        },
      },
    });
  } catch {
    // never let monitoring break the request error flow
  }
}
