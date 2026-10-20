import { AuditLog } from "../models/index.js";
import logger from "../utils/logger.js";

export async function audit(req, action, { targetType, targetId, targetLabel, meta } = {}) {
  try {
    await AuditLog.create({
      actor: req?.user?._id,
      actorName: req?.user?.name || "System",
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      targetLabel,
      meta,
      ip: req?.ip,
    });
  } catch (err) {
    logger.warn({ err, action }, "audit failed");
  }
}
