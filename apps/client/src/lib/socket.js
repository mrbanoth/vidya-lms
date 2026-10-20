import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  socket?.disconnect();
  socket = io(import.meta.env.VITE_API_URL || "/", {
    path: "/socket.io",
    auth: { token },
    // Polling first: works through the Vercel /socket.io rewrite, then upgrades when possible.
    transports: ["polling", "websocket"],
  });
  return socket;
}

export const getSocket = () => socket;

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
