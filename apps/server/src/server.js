import http from "node:http";
import env from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { bootstrap } from "./services/bootstrap.js";
import { initSockets } from "./sockets/index.js";
import logger from "./utils/logger.js";

async function start() {
  await connectDB();
  await bootstrap();
  const server = http.createServer(createApp());
  initSockets(server);
  server.listen(env.PORT, () => logger.info(`API ready on http://localhost:${env.PORT}/api/v1`));

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (err) => logger.error({ err }, "unhandledRejection"));
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start");
  process.exit(1);
});
