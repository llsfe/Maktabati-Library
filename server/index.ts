import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security: Helmet for secure headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://unpkg.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: [
          "'self'",
          "http://127.0.0.1:*",
          "ws://127.0.0.1:*",
          "http://localhost:*",
          "ws://localhost:*",
          "safe-file:",
          "https://unpkg.com",
        ],
        frameSrc: ["'self'", "blob:", "safe-file:"],
        workerSrc: ["'self'", "blob:", "https://unpkg.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for PDF viewing
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Security: CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and Electron file:// origin (which often shows up as null or file://)
      if (
        !origin ||
        origin === "null" ||
        origin.startsWith("file://") ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Security: Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

export async function startServer(
  port: number,
  isPackaged: boolean = false,
  dataDir?: string,
) {
  await registerRoutes(httpServer, app, isPackaged, dataDir);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(statusCode).json({ message });
  });

  if (process.env.NODE_ENV === "production" && !isPackaged) {
    serveStatic(app);
  } else if (!process.env.VITE_DEV_SERVER_URL && !isPackaged) {
    // Only setup Vite middleware if we are NOT in Electron Dev mode
    // In Electron, Vite is already running as a separate process
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  return new Promise<void>((resolve, reject) => {
    httpServer.on("error", (err) => {
      console.error("Server error:", err);
      reject(err);
    });

    httpServer.listen(
      {
        port,
        host: "127.0.0.1",
      },
      () => {
        log(`serving on port ${port}`);
        resolve();
      },
    );
  });
}

// Start server if this file is run directly
if (
  import.meta.url &&
  import.meta.url.startsWith("file:") &&
  process.argv[1] &&
  (process.argv[1].endsWith("index.ts") ||
    process.argv[1].endsWith("index.cjs"))
) {
  const port = parseInt(process.env.PORT || "5000", 10);
  startServer(port).catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
