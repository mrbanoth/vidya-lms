import { Notification } from "../models/index.js";
import { emitToUser } from "../sockets/index.js";
import logger from "../utils/logger.js";

/** Stores a notification and pushes it to the user's open tabs. Never throws. */
export async function notify(userId, { type = "system", title, body = "", link = "" }) {
  try {
    const n = await Notification.create({ user: userId, type, title, body, link });
    emitToUser(String(userId), "notification", n.toJSON());
    return n;
  } catch (err) {
    logger.warn({ err }, "notify failed");
    return null;
  }
}
