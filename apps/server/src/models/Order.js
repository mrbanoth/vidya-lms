import mongoose from "mongoose";
import { ORDER_STATUS } from "@vidya/shared";

const itemSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    price: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [itemSchema],
    original: Number,
    subtotal: Number,
    discount: { type: Number, default: 0 },
    tax: Number,
    total: Number,
    currency: { type: String, default: "INR" },
    coupon: String,
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    gateway: { type: String, enum: ["razorpay", "test", "free"], default: "razorpay" },
    gatewayOrderId: { type: String, index: true },
    paymentId: String,
    method: String,
    invoiceNo: { type: String, unique: true, sparse: true },
    paidAt: Date,
    refund: {
      reason: String,
      requestedAt: Date,
      processedAt: Date,
      amount: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
