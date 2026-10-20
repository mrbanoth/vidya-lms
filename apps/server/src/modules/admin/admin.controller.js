import {
  AuditLog,
  Category,
  Coupon,
  Course,
  Enrollment,
  Order,
  Payout,
  Review,
  Session,
  Setting,
  User,
} from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import { escapeRegex, pageMeta, pageParams } from "../../utils/paginate.js";
import { audit } from "../../services/audit.js";
import { notify } from "../../services/notify.js";
import { sendEmail, templates } from "../../utils/email.js";
import { round2 } from "../../utils/money.js";
import { processRefund } from "../commerce/commerce.controller.js";
import { checklist } from "../instructor/instructor.controller.js";

const daysAgo = (n) => new Date(Date.now() - n * 864e5);

/** Paid revenue per category since a date: group by course in Mongo, map to categories in memory. */
async function revenueByCategory(since) {
  const byCourse = await Order.aggregate([
    { $match: { status: "paid", paidAt: { $gte: since } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.course", total: { $sum: "$items.price" } } },
  ]);
  const courses = await Course.find({ _id: { $in: byCourse.map((r) => r._id) } })
    .select("category")
    .populate("category", "name")
    .lean();
  const totals = {};
  for (const row of byCourse) {
    const c = courses.find((x) => String(x._id) === String(row._id));
    const name = c?.category?.name || "Other";
    totals[name] = (totals[name] || 0) + row.total;
  }
  return Object.entries(totals)
    .map(([name, total]) => ({ name, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}
const pctChange = (now, prev) => (prev ? round2(((now - prev) / prev) * 100) : now ? 100 : 0);

export async function overview(_req, res) {
  const [active30, activePrev, gmv, gmvPrev, pending, failed, failedPrev, signups, revenueByCat, refundsPending, payoutsPending, recent] =
    await Promise.all([
      User.countDocuments({ lastLoginAt: { $gte: daysAgo(30) } }),
      User.countDocuments({ lastLoginAt: { $gte: daysAgo(60), $lt: daysAgo(30) } }),
      Order.aggregate([{ $match: { status: "paid", paidAt: { $gte: daysAgo(30) } } }, { $group: { _id: null, t: { $sum: "$total" } } }]),
      Order.aggregate([{ $match: { status: "paid", paidAt: { $gte: daysAgo(60), $lt: daysAgo(30) } } }, { $group: { _id: null, t: { $sum: "$total" } } }]),
      Course.countDocuments({ status: "review" }),
      Order.countDocuments({ status: "failed", createdAt: { $gte: daysAgo(30) } }),
      Order.countDocuments({ status: "failed", createdAt: { $gte: daysAgo(60), $lt: daysAgo(30) } }),
      User.find({ createdAt: { $gte: daysAgo(30) } }).select("createdAt").lean(),
      revenueByCategory(daysAgo(30)),
      Order.countDocuments({ status: "refund_requested" }),
      Payout.countDocuments({ status: "requested" }),
      AuditLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(29 - i).toISOString().slice(0, 10);
    return { day: d, count: signups.filter((u) => u.createdAt.toISOString().startsWith(d)).length };
  });
  res.json({
    success: true,
    data: {
      activeUsers: active30,
      activeUsersChange: pctChange(active30, activePrev),
      gmv: round2(gmv[0]?.t || 0),
      gmvChange: pctChange(gmv[0]?.t || 0, gmvPrev[0]?.t || 0),
      pendingReview: pending,
      failedPayments: failed,
      failedChange: failed - failedPrev,
      refundsPending,
      payoutsPending,
      signups: days,
      revenueByCategory: revenueByCat,
      recent,
      totals: {
        users: await User.countDocuments({ deletedAt: null }),
        courses: await Course.countDocuments({ status: "published" }),
        enrollments: await Enrollment.countDocuments(),
      },
    },
  });
}

/* ---------- users ---------- */
export async function users(req, res) {
  const { page, limit, skip } = pageParams(req.query, 20);
  const filter = { deletedAt: null };
  if (req.query.role && req.query.role !== "all") filter.role = req.query.role;
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: items.map(({ password: _p, ...u }) => u),
    meta: pageMeta(total, page, limit),
  });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest("You cannot change your own account here");
  const before = { role: user.role, status: user.status };
  Object.assign(user, req.body);
  await user.save();
  if (req.body.status === "banned") await Session.updateMany({ user: user._id }, { revoked: true });
  const action = req.body.status ? `user.${req.body.status === "banned" ? "ban" : "unban"}` : "user.role";
  await audit(req, action, { targetType: "User", targetId: user._id, targetLabel: user.email, meta: { before, after: req.body } });
  res.json({ success: true, message: "User updated", data: user });
}

/* ---------- course review ---------- */
export async function reviewQueue(req, res) {
  const status = req.query.status || "review";
  const filter = status === "all" ? { status: { $in: ["review", "published", "rejected"] } } : { status };
  const courses = await Course.find(filter)
    .sort({ submittedAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("instructor", "name email avatar")
    .populate("category", "name");
  const data = await Promise.all(
    courses.map(async (c) => ({ ...c.toJSON(), checklist: await checklist(c) }))
  );
  res.json({ success: true, data });
}

export async function decideCourse(req, res) {
  const course = await Course.findById(req.params.id).populate("instructor", "name email");
  if (!course) throw ApiError.notFound("Course not found");
  const approve = req.body.decision === "approve";
  if (approve && course.status !== "published") {
    course.status = "published";
    course.publishedAt = new Date();
    await Category.updateOne({ _id: course.category }, { $inc: { courseCount: 1 } });
  } else if (!approve) {
    if (course.status === "published") await Category.updateOne({ _id: course.category }, { $inc: { courseCount: -1 } });
    course.status = "rejected";
  }
  course.reviewNote = req.body.reason || "";
  await course.save();
  await notify(course.instructor._id, {
    type: "course",
    title: approve ? `"${course.title}" is live` : `Changes requested for "${course.title}"`,
    body: approve ? "It now appears in the catalog." : req.body.reason,
    link: `/studio/courses/${course._id}`,
  });
  await sendEmail(course.instructor.email, templates.courseDecision(course.instructor.name, course.title, approve, req.body.reason));
  await audit(req, approve ? "course.approve" : "course.reject", {
    targetType: "Course",
    targetId: course._id,
    targetLabel: course.title,
    meta: { reason: req.body.reason },
  });
  res.json({ success: true, message: approve ? "Approved and published" : "Changes requested", data: course });
}

export async function toggleBestseller(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound();
  course.bestseller = !course.bestseller;
  await course.save();
  await audit(req, "course.bestseller", { targetType: "Course", targetId: course._id, targetLabel: course.title });
  res.json({ success: true, data: course });
}

/* ---------- payments ---------- */
export async function payments(req, res) {
  const { page, limit, skip } = pageParams(req.query, 20);
  const filter = { status: { $ne: "pending" } };
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  const [items, total, sums] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email").lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo(30) } } },
      { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
  ]);
  const pick = (s) => sums.find((x) => x._id === s) || { total: 0, count: 0 };
  const payoutsDue = await Payout.aggregate([{ $match: { status: "requested" } }, { $group: { _id: null, t: { $sum: "$amount" } } }]);
  res.json({
    success: true,
    data: items,
    meta: {
      ...pageMeta(total, page, limit),
      summary: {
        collected: round2(pick("paid").total),
        refunded: round2(pick("refunded").total),
        failed: pick("failed").count,
        refundRequests: await Order.countDocuments({ status: "refund_requested" }),
        payoutsDue: round2(payoutsDue[0]?.t || 0),
      },
    },
  });
}

export async function decideRefund(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order || order.status !== "refund_requested") throw ApiError.badRequest("No pending refund for this order");
  if (req.body.decision === "approve") {
    await processRefund(order);
    await audit(req, "payment.refund", { targetType: "Order", targetId: order._id, targetLabel: `${order.invoiceNo} · ₹${order.total}` });
  } else {
    order.status = "paid";
    await order.save();
    await notify(order.user, { type: "billing", title: "Refund declined", body: req.body.reason || "", link: "/orders" });
    await audit(req, "payment.refund_reject", { targetType: "Order", targetId: order._id, targetLabel: order.invoiceNo });
  }
  res.json({ success: true, data: order });
}

export async function payouts(_req, res) {
  const items = await Payout.find().sort({ createdAt: -1 }).limit(100).populate("instructor", "name email").lean();
  res.json({ success: true, data: items });
}

export async function decidePayout(req, res) {
  const p = await Payout.findById(req.params.id);
  if (!p || p.status !== "requested") throw ApiError.badRequest("This payout was already handled");
  p.status = req.body.decision === "approve" ? "paid" : "rejected";
  if (p.status === "paid") {
    p.paidAt = new Date();
    p.reference = `UTR${Date.now()}`;
  }
  await p.save();
  await notify(p.instructor, {
    type: "billing",
    title: p.status === "paid" ? `Payout of ₹${p.amount} sent` : "Payout request declined",
    link: "/studio/earnings",
  });
  await audit(req, `payout.${p.status}`, { targetType: "Payout", targetId: p._id, targetLabel: `₹${p.amount}` });
  res.json({ success: true, data: p });
}

/* ---------- coupons ---------- */
export async function coupons(_req, res) {
  res.json({ success: true, data: await Coupon.find().sort({ createdAt: -1 }).lean() });
}
export async function createCoupon(req, res) {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  await audit(req, "coupon.create", { targetType: "Coupon", targetId: coupon._id, targetLabel: coupon.code });
  res.status(201).json({ success: true, data: coupon });
}
export async function updateCoupon(req, res) {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound();
  await audit(req, "coupon.update", { targetType: "Coupon", targetId: coupon._id, targetLabel: coupon.code });
  res.json({ success: true, data: coupon });
}
export async function deleteCoupon(req, res) {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound();
  await audit(req, "coupon.delete", { targetType: "Coupon", targetLabel: coupon.code });
  res.json({ success: true });
}

/* ---------- categories ---------- */
export async function createCategory(req, res) {
  const cat = await Category.create(req.body);
  await audit(req, "category.create", { targetType: "Category", targetId: cat._id, targetLabel: cat.name });
  res.status(201).json({ success: true, data: cat });
}
export async function updateCategory(req, res) {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound();
  Object.assign(cat, req.body);
  await cat.save();
  await audit(req, "category.update", { targetType: "Category", targetId: cat._id, targetLabel: cat.name });
  res.json({ success: true, data: cat });
}
export async function deleteCategory(req, res) {
  if (await Course.exists({ category: req.params.id }))
    throw ApiError.badRequest("Move the courses in this category before deleting it");
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw ApiError.notFound();
  await audit(req, "category.delete", { targetType: "Category", targetLabel: cat.name });
  res.json({ success: true });
}

/* ---------- reviews moderation ---------- */
export async function hideReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound();
  review.hidden = !review.hidden;
  await review.save();
  await Review.refreshCourseRating(review.course);
  await audit(req, review.hidden ? "review.hide" : "review.show", { targetType: "Review", targetId: review._id });
  res.json({ success: true, data: review });
}

/* ---------- audit, settings, reports ---------- */
export async function auditLog(req, res) {
  const { page, limit, skip } = pageParams(req.query, 30);
  const filter = {};
  if (req.query.action && req.query.action !== "all") filter.action = String(req.query.action);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
    filter.$or = [{ actorName: rx }, { targetLabel: rx }, { action: rx }];
  }
  const [items, total, actions] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
    AuditLog.distinct("action"),
  ]);
  res.json({ success: true, data: items, meta: { ...pageMeta(total, page, limit), actions } });
}

export async function getSettings(_req, res) {
  res.json({ success: true, data: await Setting.get() });
}

export async function updateSettings(req, res) {
  const s = await Setting.get();
  const { features, ...rest } = req.body;
  Object.assign(s, rest);
  if (features) Object.assign(s.features, features);
  await s.save();
  await audit(req, "settings.update", { targetType: "Setting", meta: req.body });
  res.json({ success: true, message: "Settings saved", data: s });
}

export async function reports(req, res) {
  const days = Math.min(365, Number(req.query.days) || 30);
  const since = daysAgo(days);
  const { Activity } = await import("../../models/index.js");
  const sinceDay = since.toISOString().slice(0, 10);
  const [enrolled, completed, minutes, activeLearners, paidOrders, refunded, users, byInstructor, topCourses] =
    await Promise.all([
      Enrollment.countDocuments({ createdAt: { $gte: since } }),
      Enrollment.countDocuments({ createdAt: { $gte: since }, completedAt: { $ne: null } }),
      Activity.aggregate([{ $match: { day: { $gte: sinceDay } } }, { $group: { _id: null, m: { $sum: "$minutes" } } }]),
      Activity.distinct("user", { day: { $gte: sinceDay } }),
      Order.find({ status: "paid", paidAt: { $gte: since } }).select("user total").lean(),
      Order.aggregate([
        { $match: { status: "refunded", paidAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      User.countDocuments({ createdAt: { $gte: since } }),
      Order.aggregate([
        { $match: { status: "paid", paidAt: { $gte: since } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.instructor", total: { $sum: "$items.price" } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
      Course.find({ status: "published" }).sort({ studentsCount: -1 }).limit(1).select("_id title studentsCount").lean(),
    ]);
  const people = await User.find({ _id: { $in: byInstructor.map((b) => b._id) } }).select("name avatar").lean();
  const topInstructors = byInstructor.map((b) => {
    const u = people.find((p) => String(p._id) === String(b._id));
    return { _id: b._id, name: u?.name || "Unknown", avatar: u?.avatar, total: b.total };
  });
  let funnel = [];
  if (topCourses[0]) {
    const c = topCourses[0];
    const all = await Enrollment.find({ course: c._id }).select("progress completedAt").lean();
    const n = all.length || 1;
    const stage = (fn) => all.filter(fn).length;
    funnel = [
      { label: "Enrolled", value: all.length, pct: 100 },
      { label: "Started", value: stage((e) => e.progress > 0), pct: Math.round((stage((e) => e.progress > 0) / n) * 100) },
      { label: "Halfway", value: stage((e) => e.progress >= 50), pct: Math.round((stage((e) => e.progress >= 50) / n) * 100) },
      { label: "Completed", value: stage((e) => e.completedAt), pct: Math.round((stage((e) => e.completedAt) / n) * 100) },
    ];
  }
  const paidTotal = paidOrders.reduce((t, o) => t + o.total, 0);
  const refundedTotal = refunded[0]?.total || 0;
  const buyers = new Set(paidOrders.map((o) => String(o.user))).size;
  res.json({
    success: true,
    data: {
      days,
      completionRate: enrolled ? round2((completed / enrolled) * 100) : 0,
      avgMinutesPerLearner: activeLearners.length
        ? Math.round((minutes[0]?.m || 0) / activeLearners.length / days)
        : 0,
      refundRate: paidTotal + refundedTotal ? round2((refundedTotal / (paidTotal + refundedTotal)) * 100) : 0,
      conversion: users ? round2(Math.min(100, (buyers / users) * 100)) : 0,
      funnelCourse: topCourses[0]?.title,
      funnel,
      topInstructors: topInstructors.map((t) => ({ ...t, total: round2(t.total) })),
    },
  });
}
