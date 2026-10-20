import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : process.env.LOG_LEVEL || "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
  ...(isDev && { transport: { target: "pino-pretty", options: { colorize: true } } }),
});

export default logger;
