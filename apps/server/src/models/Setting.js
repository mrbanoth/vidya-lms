import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "platform", unique: true },
    platformName: { type: String, default: "Vidya" },
    supportEmail: { type: String, default: "" },
    revenueShare: { type: Number, default: 70 },
    features: {
      instructorSignup: { type: Boolean, default: true },
      requireReview: { type: Boolean, default: true },
      googleLogin: { type: Boolean, default: true },
      maintenance: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function get() {
  return (await this.findOne({ key: "platform" })) || this.create({ key: "platform" });
};

export default mongoose.model("Setting", settingSchema);
