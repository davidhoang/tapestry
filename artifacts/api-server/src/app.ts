import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { setupAuth, resolveClerkUser } from "./auth";
import { setupMobileAuth } from "./mobile-routes";
import { setupMcpRoutes } from "./mcp-http";
import { setupCliRoutes } from "./cli-routes";
import { registerRoutes } from "./routes/routes";
import { jsonErrorHandler } from "./middlewares/json-error-handler";

const app: Express = express();

app.set("trust proxy", 1);

// Production security hardening
if (app.get("env") === "production") {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://clerk.tapestry.design"],
        "connect-src": ["'self'", "https://clerk.tapestry.design", "https://accounts.tapestry.design", "https://*.clerk.accounts.dev"],
        "frame-src": ["'self'", "https://accounts.tapestry.design", "https://*.clerk.accounts.dev"],
        "worker-src": ["'self'", "blob:"],
        "frame-ancestors": ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: { policy: "credentialless" },
  }));
}

// Rate-limit applies only to mobile and MCP automation endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: (req) => {
    return !req.path.startsWith("/api/mobile") && !req.path.startsWith("/mcp");
  },
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-workspace-slug"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Static asset cache headers
app.use((req, res, next) => {
  if (req.url.startsWith("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000");
  }
  next();
});

app.use(apiLimiter);

// Clerk middleware — validates session tokens from both cookies (web) and Bearer headers (mobile/CLI)
app.use(clerkMiddleware({
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

// Resolve the Clerk userId to a local DB user and set req.user
app.use(resolveClerkUser);

// Set up mobile endpoints
setupMobileAuth(app);

// Set up MCP HTTP routes for Claude Desktop integration
setupMcpRoutes(app);

// Set up CLI API routes
setupCliRoutes(app);

// Set up /api/user endpoint
setupAuth(app);

// Register all main API routes (includes health check at /api/healthz)
registerRoutes(app);

// Dev-only forced error routes to verify the JSON error handler.
// Gated on NODE_ENV !== "production" AND an explicit ENABLE_DEBUG_ROUTES flag,
// so they cannot accidentally ship in staging-style environments.
if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEBUG_ROUTES === "true") {
  app.get("/api/_debug/force-error", (req, _res, next) => {
    const kind = (req.query.kind as string | undefined) ?? "generic";
    if (kind === "undefined_column") {
      const err = new Error('column "does_not_exist" does not exist') as Error & {
        code?: string; table?: string; column?: string;
      };
      err.code = "42703";
      err.table = "api_tokens";
      err.column = "does_not_exist";
      next(err);
      return;
    }
    if (kind === "undefined_table") {
      const err = new Error('relation "missing_table" does not exist') as Error & {
        code?: string;
      };
      err.code = "42P01";
      next(err);
      return;
    }
    next(new Error("forced generic error"));
  });
  app.post("/mcp/_debug/force-error", (_req, _res, next) => {
    const err = new Error('column "usage_count" does not exist') as Error & {
      code?: string; table?: string; column?: string;
    };
    err.code = "42703";
    err.table = "api_tokens";
    err.column = "usage_count";
    next(err);
  });
}

// JSON error handler for /api and /mcp — must be registered last so it catches
// errors thrown from any route handler. Express 5 forwards async errors here.
app.use(jsonErrorHandler);

export default app;
