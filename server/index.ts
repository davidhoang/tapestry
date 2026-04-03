import express, { type Request, Response, NextFunction } from "express";
import { clerkMiddleware } from "@clerk/express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { setupAuth, resolveClerkUser } from "./auth";
import { setupMobileAuth } from "./jwt-auth";
import { setupMcpRoutes } from "./mcp-http";
import { setupCliRoutes } from "./cli-routes";

const app = express();

app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: (req) => {
    return !req.path.startsWith('/api/mobile') && !req.path.startsWith('/mcp');
  },
});

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-workspace-slug'],
}));

app.use((req, res, next) => {
  if (req.url.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

app.use(apiLimiter);

// Clerk middleware — validates session tokens from both cookies (web) and Bearer headers (mobile/CLI)
// The publishable key is stored as VITE_CLERK_PUBLISHABLE_KEY (for frontend access via Vite)
// so we pass it explicitly here for the backend SDK
app.use(clerkMiddleware({
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

// Resolve the Clerk userId to a local DB user and set req.user
app.use(resolveClerkUser);

// Set up mobile endpoints (auth now via Clerk instead of custom JWT)
setupMobileAuth(app);

// Set up MCP HTTP routes for Claude Desktop integration
setupMcpRoutes(app);

// Set up CLI API routes (Bearer token auth at /api/cli/* using tap_ tokens)
setupCliRoutes(app);

// Set up /api/user endpoint
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    app.use("/.well-known", (_req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    const server = registerRoutes(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`Error ${status}:`, err);
      res.status(status).json({ message });
    });

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT} in ${app.get("env")} mode`);
    });

    const shutdown = () => {
      log('Shutting down gracefully...');
      server.close(() => {
        log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
})();
