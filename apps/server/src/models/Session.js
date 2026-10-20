import mongoose from "mongoose";

/** One row per refresh token. A family groups rotations of a single login. */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    family: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    revoked: { type: Boolean, default: false },
    replacedBy: String,
    userAgent: String,
    ip: String,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
