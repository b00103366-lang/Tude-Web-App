import express, { type Express } from "express";
import cors from "cors";
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

// Limit request body size to prevent payload attacks
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

export default app;
