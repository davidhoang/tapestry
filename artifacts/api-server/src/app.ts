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
    // COEP disabled: "credentialless" strips cookies on cross-origin sub-resource
    // requests to clerk.tapestry.design, which breaks Clerk's OAuth handshake
    // (Google sign-in lands back on the signed-out home page).
    crossOriginEmbedderPolicy: false,
  }));
}

// Rate-limit applies to mobile, MCP automation, and public portfolio endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: (req) => {
    return !req.path.startsWith("/api/mobile") &&
           !req.path.startsWith("/mcp") &&
           !req.path.startsWith("/api/public/");
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

// Strict body-size limit for unauthenticated public portfolio write endpoints.
// Must be registered BEFORE the global 10mb parser so body-parser honours the
// smaller cap for these paths (body-parser skips re-parsing once req._body=true).
app.use("/api/public/portfolios", express.json({ limit: "16kb" }));
app.use("/api/public/portfolios", express.urlencoded({ extended: false, limit: "16kb" }));

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

export default app;
