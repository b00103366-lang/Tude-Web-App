import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import router from "./routes";

const app: Express = express();
const IS_PROD = process.env["NODE_ENV"] === "production";

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image/file CDN serving
  contentSecurityPolicy: false, // frontend is on a separate domain; CSP is set there
}));

// ── CORS — fail CLOSED in production if CORS_ORIGINS is not set ────────────
const rawCorsOrigins = process.env["CORS_ORIGINS"];
const allowedOrigins: string[] = rawCorsOrigins
  ? rawCorsOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

if (IS_PROD && allowedOrigins.length === 0) {
  console.error("FATAL: CORS_ORIGINS is not set in production. Refusing to start with open CORS.");
  process.exit(1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow all origins (including no-origin requests from curl/server-to-server)
      if (!IS_PROD) {
        return callback(null, true);
      }
      // In production: no-origin requests (server-to-server) are blocked
      if (!origin) {
        return callback(new Error("No origin header"), false);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
// Storage uploads (base64 file content) need a higher limit than other routes
app.use("/api/storage/uploads/direct", express.json({ limit: "20mb" }));

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", router);

// 404 handler — return JSON for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — return JSON, never leak internal details in production
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status ?? err?.statusCode ?? 500;
  // In production, hide internal error messages from clients
  const message = IS_PROD && status >= 500
    ? "Internal server error"
    : (err?.message ?? "Internal server error");
  if (status >= 500) console.error("Express error:", err);
  res.status(status).json({ error: message });
});

export default app;
