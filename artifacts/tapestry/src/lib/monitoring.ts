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
