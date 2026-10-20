import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "System" },
    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: String,
    targetLabel: String,
    meta: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);
auditSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditSchema);
