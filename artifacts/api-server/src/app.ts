import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";

const app: Express = express();

// Restrict CORS to configured origins only.
// Set CORS_ORIGINS to a comma-separated list of allowed origins, e.g.:
//   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
const rawCorsOrigins = process.env["CORS_ORIGINS"];
const allowedOrigins: string[] = rawCorsOrigins
  ? rawCorsOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl) only in development
      if (!origin) {
        if (process.env["NODE_ENV"] !== "production") {
          return callback(null, true);
        }
        return callback(new Error("No origin header"), false);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  })
);

// Storage uploads (base64 file content) need a higher limit than other routes
app.use("/api/storage/uploads/direct", express.json({ limit: "20mb" }));

// All other routes: keep a tight limit
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", router);

// 404 handler — return JSON for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — return JSON instead of HTML
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status ?? err?.statusCode ?? 500;
  const message = err?.message ?? "Internal server error";
  console.error("Express error:", err);
  res.status(status).json({ error: message });
});

export default app;
