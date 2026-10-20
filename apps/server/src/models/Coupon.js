import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

couponSchema.methods.isUsable = function isUsable() {
  if (!this.active) return "This coupon is no longer active";
  if (this.expiresAt && this.expiresAt < new Date()) return "This coupon has expired";
  if (this.maxUses && this.used >= this.maxUses) return "This coupon has reached its limit";
  return null;
};

export default mongoose.model("Coupon", couponSchema);
