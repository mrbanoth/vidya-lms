import { Setting } from "../models/index.js";
import { optionalAuth } from "./auth.js";

let cache = { at: 0, on: false };

/** Blocks non-admin traffic while maintenance mode is on (cached for 15s). */
export async function maintenance(req, res, next) {
  if (Date.now() - cache.at > 15000) {
    const s = await Setting.get();
    cache = { at: Date.now(), on: s.features.maintenance };
  }
  if (!cache.on) return next();
  await optionalAuth(req, res, () => {});
  if (req.user?.role === "admin") return next();
  res.status(503).json({ success: false, message: "Vidya is down for maintenance. Back shortly." });
}

export const resetMaintenanceCache = () => (cache = { at: 0, on: false });
