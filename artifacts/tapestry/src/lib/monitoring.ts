import * as Sentry from "@sentry/react";

let initialized = false;

export function initMonitoring() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const environment =
    (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
    (import.meta.env.PROD ? "production" : "development");
  const release = import.meta.env.VITE_SENTRY_RELEASE as string | undefined;

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });

  initialized = true;
}

/**
 * Attach (or clear) the signed-in user on error reports. We deliberately send
 * only the stable user id — no email or name — to keep PII out of monitoring
 * (sendDefaultPii is false). No-op until monitoring is initialized.
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
