import type { ErrorRequestHandler, Request } from "express";
import { logger } from "../lib/logger";

interface PostgresErrorShape {
  code?: string;
  table?: string;
  column?: string;
  constraint?: string;
  detail?: string;
  schema?: string;
  routine?: string;
  message?: string;
}

function findPgError(err: unknown): PostgresErrorShape | null {
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur === "object" && cur !== null) {
      const c = cur as PostgresErrorShape & { cause?: unknown };
      if (typeof c.code === "string" && /^[0-9A-Z]{5}$/.test(c.code)) {
        return c;
      }
      cur = c.cause;
    } else {
      break;
    }
  }
  return null;
}

function shouldRespondJson(req: Request): boolean {
  return req.path === "/mcp" || req.path.startsWith("/mcp/") ||
    req.path === "/api" || req.path.startsWith("/api/");
}

export const jsonErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request & { id?: string | number }).id;
  const pg = findPgError(err);

  const baseLog = {
    err,
    requestId,
    path: req.path,
    method: req.method,
    pgCode: pg?.code,
    pgTable: pg?.table,
    pgColumn: pg?.column,
    pgConstraint: pg?.constraint,
  };

  if (pg?.code === "42703") {
    logger.error(baseLog, `Postgres undefined_column on ${pg.table ?? "?"}.${pg.column ?? "?"} — schema drift; re-publish to apply migrations`);
  } else if (pg?.code === "42P01") {
    logger.error(baseLog, `Postgres undefined_table ${pg.table ?? pg.message ?? "?"} — schema drift; re-publish to apply migrations`);
  } else {
    logger.error(baseLog, "Unhandled error in request");
  }

  if (res.headersSent) {
    return;
  }

  if (!shouldRespondJson(req)) {
    res.status(500).send("Internal Server Error");
    return;
  }

  const isProd = process.env.NODE_ENV === "production";
  const errMessage = err instanceof Error ? err.message : String(err);

  if (pg?.code === "42703") {
    res.status(500).json({
      error: "database_schema_mismatch",
      code: "42703",
      message: `Database is missing column "${pg.column ?? "unknown"}" on table "${pg.table ?? "unknown"}". The production schema is out of sync with the application — re-publish to apply pending migrations.`,
      table: pg.table,
      column: pg.column,
      requestId,
    });
    return;
  }

  if (pg?.code === "42P01") {
    res.status(500).json({
      error: "database_schema_mismatch",
      code: "42P01",
      message: `Database is missing a table referenced by this request. The production schema is out of sync — re-publish to apply pending migrations.`,
      detail: pg.message,
      requestId,
    });
    return;
  }

  res.status(500).json({
    error: "internal_server_error",
    message: isProd ? "Internal server error" : errMessage,
    requestId,
    ...(pg?.code ? { pgCode: pg.code } : {}),
  });
};
