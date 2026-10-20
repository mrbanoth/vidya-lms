import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    tds: { type: Number, default: 0 },
    method: { type: String, default: "UPI" },
    destination: String,
    status: { type: String, enum: ["requested", "paid", "rejected"], default: "requested" },
    reference: String,
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Payout", payoutSchema);
