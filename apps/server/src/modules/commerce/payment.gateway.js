import Razorpay from "razorpay";
import env from "../../config/env.js";
import { hmac, safeEqual } from "../../utils/crypto.js";

const client = env.paymentsLive
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;

export const gatewayMode = () => (client ? "razorpay" : "test");

export async function createGatewayOrder(order) {
  if (!client) return { id: `test_${order._id}` };
  return client.orders.create({
    amount: Math.round(order.total * 100),
    currency: "INR",
    receipt: String(order._id),
    notes: { userId: String(order.user) },
  });
}

export function verifyCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!client) return false;
  const expected = hmac(env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
  return safeEqual(expected, razorpay_signature || "");
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  return safeEqual(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature || "");
}

export async function refundPayment(order) {
  if (!client || order.gateway !== "razorpay" || !order.paymentId) return { id: `test_refund_${order._id}` };
  return client.payments.refund(order.paymentId, { amount: Math.round(order.total * 100) });
}
