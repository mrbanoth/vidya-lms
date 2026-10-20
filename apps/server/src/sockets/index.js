import { Server } from "socket.io";
import env from "../config/env.js";
import { verifyAccessToken } from "../utils/tokens.js";
import logger from "../utils/logger.js";

let io = null;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.allowedOrigins, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth?.token || "");
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.role === "admin") socket.join("admins");
    logger.debug({ user: socket.data.userId }, "socket connected");
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(event, payload) {
  io?.to("admins").emit(event, payload);
}
