import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import env from "./config/env.js";
import logger from "./utils/logger.js";
import api from "./routes.js";
import { sanitize } from "./middlewares/sanitize.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import { webhook } from "./modules/commerce/commerce.controller.js";
import { UPLOAD_DIR } from "./services/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://accounts.google.com"],
          frameSrc: ["'self'", "https://api.razorpay.com", "https://www.youtube-nocookie.com", "https://www.youtube.com", "https://accounts.google.com", "https://player.vimeo.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          mediaSrc: ["'self'", "blob:", "https:"],
          connectSrc: ["'self'", "https://lumberjack.razorpay.com", "https://accounts.google.com", "wss:", "ws:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        },
      },
    })
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.allowedOrigins.includes(origin)),
      credentials: true,
    })
  );
  app.use(compression());
  if (!env.isTest) app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/v1/health" } }));

  // Webhook needs the raw body for signature checks, so it is mounted before JSON parsing.
  app.post("/api/v1/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), webhook);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitize);

  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d", fallthrough: false }));
  app.use("/api/v1", apiLimiter, api);
  app.use("/api", notFound);

  // In production the API also serves the built React app.
  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (env.isProd && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: "1y", index: false }));
    app.get("/{*splat}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
