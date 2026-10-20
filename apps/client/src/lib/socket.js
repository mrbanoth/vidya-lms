import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  socket?.disconnect();
  socket = io(import.meta.env.VITE_API_URL || "/", {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export const getSocket = () => socket;

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
