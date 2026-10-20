import { Coupon, Course, Enrollment, Order, User } from "../../models/index.js";
import { REFUND_WINDOW_DAYS } from "@vidya/shared";
import env from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { priceCart, effectivePrice } from "../../utils/money.js";
import { enroll } from "../../services/learning.js";
import { notify } from "../../services/notify.js";
import { emitToAdmins } from "../../sockets/index.js";
import { sendEmail, templates } from "../../utils/email.js";
import { randomToken } from "../../utils/crypto.js";
import logger from "../../utils/logger.js";
import {
  createGatewayOrder,
  gatewayMode,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  refundPayment,
} from "./payment.gateway.js";

async function loadPurchasable(userId, courseIds) {
  const courses = await Course.find({ _id: { $in: courseIds }, status: "published" })
    .select("title price discountPrice instructor")
    .lean();
  if (courses.length !== new Set(courseIds).size)
    throw ApiError.badRequest("One of these courses is no longer available");
  const owned = await Enrollment.find({ user: userId, course: { $in: courseIds }, revoked: false }).distinct("course");
  if (owned.length) throw ApiError.conflict("You already own one of these courses. Remove it from the cart.");
  return courses;
}

async function loadCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw ApiError.badRequest("That code is not valid. Check the spelling.");
  const problem = coupon.isUsable();
  if (problem) throw ApiError.badRequest(problem);
  return coupon;
}

export async function quote(req, res) {
  const courses = await loadPurchasable(req.user._id, req.body.courseIds);
  const coupon = await loadCoupon(req.body.code);
  res.json({ success: true, data: { coupon: coupon?.code, ...priceCart(courses, coupon) } });
}

const invoiceNo = () =>
  `VD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomToken(3).toUpperCase()}`;

async function fulfil(order, { paymentId, method } = {}) {
  if (order.status === "paid") return order;
  order.status = "paid";
  order.paymentId = paymentId || order.paymentId;
  order.method = method || order.method;
  order.paidAt = new Date();
  order.invoiceNo ||= invoiceNo();
  await order.save();
  for (const item of order.items) {
    await enroll(order.user, { _id: item.course }, { order: order._id, pricePaid: item.price });
    await notify(item.instructor, {
      type: "billing",
      title: "New enrollment",
      body: `Someone bought ${item.title}`,
      link: "/studio/earnings",
    });
  }
  if (order.coupon) await Coupon.updateOne({ code: order.coupon }, { $inc: { used: 1 } });
  const user = await User.findById(order.user).select("name email");
  await notify(order.user, {
    type: "billing",
    title: "Payment received",
    body: `Order ${order.invoiceNo} · ₹${order.total}`,
    link: "/orders",
  });
  await sendEmail(user.email, templates.receipt(user.name, order));
  emitToAdmins("order:paid", { id: order._id, total: order.total });
  return order;
}

export async function checkout(req, res) {
  const courses = await loadPurchasable(req.user._id, req.body.courseIds);
  const coupon = await loadCoupon(req.body.coupon);
  const price = priceCart(courses, coupon);
  const items = courses.map((c) => ({
    course: c._id,
    instructor: c.instructor,
    title: c.title,
    price: effectivePrice(c),
  }));

  if (price.total === 0) {
    const order = await Order.create({
      user: req.user._id,
      items,
      ...price,
      coupon: coupon?.code,
      gateway: "free",
      method: "free",
    });
    await fulfil(order);
    return res.status(201).json({ success: true, data: { order, mode: "free" } });
  }

  const mode = gatewayMode();
  if (mode === "test" && env.isProd)
    throw new ApiError(503, "Payments are not configured. Add Razorpay keys.");
  const order = await Order.create({
    user: req.user._id,
    items,
    ...price,
    coupon: coupon?.code,
    gateway: mode,
  });
  const gw = await createGatewayOrder(order);
  order.gatewayOrderId = gw.id;
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      order,
      mode,
      razorpay: mode === "razorpay" && {
        key: env.RAZORPAY_KEY_ID,
        orderId: gw.id,
        amount: Math.round(order.total * 100),
        currency: "INR",
        name: "Vidya",
        prefill: { name: req.user.name, email: req.user.email },
      },
    },
  });
}

export async function verify(req, res) {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status === "paid") return res.json({ success: true, data: order });

  if (order.gateway === "test") {
    if (env.isProd) throw ApiError.badRequest("Test payments are disabled");
    await fulfil(order, { paymentId: `test_pay_${randomToken(6)}`, method: req.body.method || "test" });
    return res.json({ success: true, data: order });
  }
  const ok =
    req.body.razorpay_order_id === order.gatewayOrderId && verifyCheckoutSignature(req.body);
  if (!ok) {
    order.status = "failed";
    await order.save();
    throw ApiError.badRequest("Payment could not be verified. No money was taken twice; contact support if charged.");
  }
  await fulfil(order, { paymentId: req.body.razorpay_payment_id, method: "razorpay" });
  res.json({ success: true, data: order });
}

export async function markFailed(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id, status: "pending" });
  if (order) {
    order.status = "failed";
    await order.save();
  }
  res.json({ success: true });
}

/** Razorpay webhook: the source of truth if the browser closes before verify. */
export async function webhook(req, res) {
  const raw = req.body instanceof Buffer ? req.body.toString("utf8") : "";
  if (!verifyWebhookSignature(raw, req.get("x-razorpay-signature")))
    return res.status(400).json({ success: false, message: "Invalid signature" });
  const event = JSON.parse(raw);
  const payment = event.payload?.payment?.entity;
  if (payment?.order_id) {
    const order = await Order.findOne({ gatewayOrderId: payment.order_id });
    if (order && event.event === "payment.captured") await fulfil(order, { paymentId: payment.id, method: payment.method });
    if (order && event.event === "payment.failed" && order.status === "pending") {
      order.status = "failed";
      await order.save();
    }
  }
  logger.info({ event: event.event }, "razorpay webhook");
  res.json({ success: true });
}

export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id, status: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .populate("items.course", "slug color")
    .lean();
  res.json({ success: true, data: orders });
}

export async function getOrder(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== "admin") filter.user = req.user._id;
  const order = await Order.findOne(filter).populate("user", "name email").populate("items.course", "slug").lean();
  if (!order) throw ApiError.notFound("Order not found");
  res.json({ success: true, data: order });
}

export async function requestRefund(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "paid" || order.gateway === "free")
    throw ApiError.badRequest("Only paid orders can be refunded");
  const ageDays = (Date.now() - order.paidAt.getTime()) / 864e5;
  if (ageDays > REFUND_WINDOW_DAYS)
    throw ApiError.badRequest(`Refunds are available for ${REFUND_WINDOW_DAYS} days after purchase`);
  order.status = "refund_requested";
  order.refund = { reason: req.body.reason, requestedAt: new Date() };
  await order.save();
  emitToAdmins("refund:requested", { id: order._id });
  res.json({ success: true, message: "Refund requested. We will review it within 2 working days.", data: order });
}

/** Used by admin to approve a refund. */
export async function processRefund(order) {
  await refundPayment(order);
  order.status = "refunded";
  order.refund = { ...order.refund, processedAt: new Date(), amount: order.total };
  await order.save();
  await Enrollment.updateMany(
    { user: order.user, course: { $in: order.items.map((i) => i.course) } },
    { revoked: true }
  );
  for (const i of order.items) await Course.updateOne({ _id: i.course }, { $inc: { studentsCount: -1 } });
  await notify(order.user, {
    type: "billing",
    title: "Refund processed",
    body: `₹${order.total} for order ${order.invoiceNo}`,
    link: "/orders",
  });
  return order;
}
