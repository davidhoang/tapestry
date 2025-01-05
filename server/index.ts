import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

const PORTS = [5000, 5001, 5002, 5003, 5004];
let currentPortIndex = 0;

async function tryStartServer() {
  if (currentPortIndex >= PORTS.length) {
    console.error('No available ports found');
    process.exit(1);
  }

  const PORT = PORTS[currentPortIndex];

  try {
    const server = registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Clean up on process termination
    const cleanup = () => {
      server.close(() => {
        log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    return new Promise((resolve, reject) => {
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${PORT} is in use, trying next port...`);
          server.close();
          currentPortIndex++;
          resolve(tryStartServer());
        } else {
          reject(error);
        }
      });

      server.listen(PORT, "0.0.0.0", () => {
        log(`Server running on port ${PORT}`);
        resolve(server);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

tryStartServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});