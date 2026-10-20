import mongoose from "mongoose";
import { Category, Course, Enrollment, Lesson, Order, Payout, Question, Review, Setting, User } from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import { saveFile } from "../../services/storage.js";
import { refreshCourseTotals } from "../../services/learning.js";
import { emitToAdmins } from "../../sockets/index.js";
import { round2 } from "../../utils/money.js";

const PALETTE = ["#0f7a5c", "#2b5fb8", "#9b3a45", "#b86a12", "#6d3f8a", "#14606e", "#285e8e", "#3a6b2a"];

async function ownCourse(req, id = req.params.id) {
  const course = await Course.findById(id);
  if (!course) throw ApiError.notFound("Course not found");
  if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin")
    throw ApiError.forbidden("You can only edit your own courses");
  return course;
}

async function ownLesson(req) {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound("Lesson not found");
  const course = await ownCourse(req, lesson.course);
  return { lesson, course };
}

/* ---------- courses ---------- */
export async function listMine(req, res) {
  const courses = await Course.find({ instructor: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("category", "name")
    .lean({ virtuals: true });
  const since = new Date(Date.now() - 30 * 864e5);
  const revenue = await Order.aggregate([
    { $match: { status: "paid", paidAt: { $gte: since } } },
    { $unwind: "$items" },
    { $match: { "items.instructor": req.user._id } },
    { $group: { _id: "$items.course", total: { $sum: "$items.price" } } },
  ]);
  const map = new Map(revenue.map((r) => [String(r._id), r.total]));
  res.json({ success: true, data: courses.map((c) => ({ ...c, revenue30d: map.get(String(c._id)) || 0 })) });
}

export async function create(req, res) {
  if (!(await Category.exists({ _id: req.body.category }))) throw ApiError.badRequest("Choose a category");
  const course = await Course.create({
    ...req.body,
    instructor: req.user._id,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    sections: [{ title: "Introduction", lessons: [] }],
  });
  res.status(201).json({ success: true, data: course });
}

export async function getOne(req, res) {
  const course = await ownCourse(req);
  await course.populate("category", "name slug");
  const lessons = await Lesson.find({ course: course._id }).lean();
  const byId = new Map(lessons.map((l) => [String(l._id), l]));
  const data = course.toJSON();
  data.sections = data.sections.map((s) => ({
    ...s,
    lessons: s.lessons.map((id) => byId.get(String(id))).filter(Boolean),
  }));
  res.json({ success: true, data });
}

export async function update(req, res) {
  const course = await ownCourse(req);
  if (req.body.discountPrice != null && req.body.discountPrice >= (req.body.price ?? course.price))
    req.body.discountPrice = null;
  Object.assign(course, req.body);
  await course.save();
  res.json({ success: true, message: "Saved", data: course });
}

export async function remove(req, res) {
  const course = await ownCourse(req);
  if (await Enrollment.exists({ course: course._id }))
    throw ApiError.badRequest("Courses with students cannot be deleted. Unpublish it instead.");
  await Lesson.deleteMany({ course: course._id });
  await course.deleteOne();
  res.json({ success: true, message: "Course deleted" });
}

export async function uploadMedia(req, res) {
  const course = await ownCourse(req);
  if (!req.file) throw ApiError.badRequest("Choose a file to upload");
  const { url } = await saveFile(req.file, `courses/${course._id}`);
  if (req.params.kind === "thumbnail") course.thumbnail = url;
  if (req.params.kind === "promo") course.promoVideo = url;
  await course.save();
  res.json({ success: true, data: { url, course } });
}

export async function uploadLessonFile(req, res) {
  const { lesson, course } = await ownLesson(req);
  if (!req.file) throw ApiError.badRequest("Choose a file to upload");
  const { url, duration } = await saveFile(req.file, `courses/${course._id}`);
  if (req.params.kind === "video") {
    lesson.videoUrl = url;
    if (duration) lesson.duration = duration;
  } else {
    lesson.resources.push({ name: req.file.originalname.slice(0, 120), url });
  }
  await lesson.save();
  await refreshCourseTotals(course._id);
  res.json({ success: true, data: lesson });
}

export async function checklist(course) {
  const lessons = await Lesson.find({ course: course._id }).select("type videoUrl content").lean();
  return [
    { key: "title", label: "Title and subtitle", done: Boolean(course.title && course.subtitle) },
    { key: "description", label: "Description of at least 100 characters", done: (course.description || "").length >= 100 },
    { key: "outcomes", label: "At least 3 learning outcomes", done: course.outcomes.length >= 3 },
    { key: "thumbnail", label: "Course thumbnail", done: Boolean(course.thumbnail) },
    { key: "lessons", label: "At least 3 lessons", done: lessons.length >= 3 },
    {
      key: "content",
      label: "Every lesson has content",
      done: lessons.length > 0 && lessons.every((l) => l.type === "quiz" || l.videoUrl || l.content),
    },
  ];
}

export async function getChecklist(req, res) {
  const course = await ownCourse(req);
  res.json({ success: true, data: await checklist(course) });
}

export async function submit(req, res) {
  const course = await ownCourse(req);
  if (!["draft", "rejected"].includes(course.status))
    throw ApiError.badRequest("This course is already in review or published");
  const items = await checklist(course);
  const missing = items.filter((i) => !i.done && ["title", "lessons", "content"].includes(i.key));
  if (missing.length) throw ApiError.badRequest(`Finish these first: ${missing.map((m) => m.label).join(", ")}`);
  const settings = await Setting.get();
  if (settings.features.requireReview) {
    course.status = "review";
    course.submittedAt = new Date();
    emitToAdmins("course:submitted", { id: course._id, title: course.title });
  } else {
    course.status = "published";
    course.publishedAt = new Date();
    await Category.updateOne({ _id: course.category }, { $inc: { courseCount: 1 } });
  }
  course.reviewNote = "";
  await course.save();
  res.json({
    success: true,
    message: course.status === "review" ? "Submitted. Review usually takes 48 hours." : "Published",
    data: course,
  });
}

export async function unpublish(req, res) {
  const course = await ownCourse(req);
  if (course.status === "published") await Category.updateOne({ _id: course.category }, { $inc: { courseCount: -1 } });
  course.status = "draft";
  await course.save();
  res.json({ success: true, message: "Moved back to draft", data: course });
}

/* ---------- curriculum ---------- */
export async function addSection(req, res) {
  const course = await ownCourse(req);
  course.sections.push({ title: req.body.title, lessons: [] });
  await course.save();
  res.status(201).json({ success: true, data: course.sections.at(-1) });
}

export async function updateSection(req, res) {
  const course = await ownCourse(req);
  const s = course.sections.id(req.params.sectionId);
  if (!s) throw ApiError.notFound("Section not found");
  s.title = req.body.title;
  await course.save();
  res.json({ success: true, data: s });
}

export async function deleteSection(req, res) {
  const course = await ownCourse(req);
  const s = course.sections.id(req.params.sectionId);
  if (!s) throw ApiError.notFound("Section not found");
  await Lesson.deleteMany({ _id: { $in: s.lessons } });
  s.deleteOne();
  await course.save();
  await refreshCourseTotals(course._id);
  res.json({ success: true });
}

export async function addLesson(req, res) {
  const course = await ownCourse(req);
  const s = course.sections.id(req.params.sectionId);
  if (!s) throw ApiError.notFound("Section not found");
  const lesson = await Lesson.create({ ...req.body, course: course._id });
  s.lessons.push(lesson._id);
  await course.save();
  await refreshCourseTotals(course._id);
  res.status(201).json({ success: true, data: lesson });
}

export async function updateLesson(req, res) {
  const { lesson, course } = await ownLesson(req);
  if (req.body.quiz) {
    for (const q of req.body.quiz.questions) {
      if (q.answer >= q.options.length) throw ApiError.badRequest(`Pick a correct answer for "${q.text}"`);
    }
  }
  Object.assign(lesson, req.body);
  await lesson.save();
  await refreshCourseTotals(course._id);
  res.json({ success: true, message: "Lesson saved", data: lesson });
}

export async function deleteLesson(req, res) {
  const { lesson, course } = await ownLesson(req);
  for (const s of course.sections) s.lessons.pull(lesson._id);
  await course.save();
  await lesson.deleteOne();
  await refreshCourseTotals(course._id);
  res.json({ success: true });
}

export async function reorder(req, res) {
  const course = await ownCourse(req);
  const known = new Set(course.sections.flatMap((s) => s.lessons.map(String)));
  const incoming = req.body.sections.flatMap((s) => s.lessons);
  if (incoming.length !== known.size || !incoming.every((id) => known.has(id)))
    throw ApiError.badRequest("Lesson list is out of date. Refresh and try again.");
  const order = new Map(req.body.sections.map((s, i) => [s.id, i]));
  course.sections.sort((a, b) => (order.get(String(a._id)) ?? 99) - (order.get(String(b._id)) ?? 99));
  for (const s of course.sections) {
    const next = req.body.sections.find((x) => x.id === String(s._id));
    if (next) s.lessons = next.lessons.map((id) => new mongoose.Types.ObjectId(id));
  }
  await course.save();
  res.json({ success: true, message: "Order saved" });
}

/* ---------- analytics ---------- */
const share = async () => (await Setting.get()).revenueShare / 100;

/** One row per sold item of this instructor: { items: item, paidAt, status }. */
async function instructorSales(instructorId, match = {}) {
  const orders = await Order.find({
    status: { $in: ["paid", "refund_requested"] },
    "items.instructor": instructorId,
    ...match,
  })
    .select("items paidAt createdAt status")
    .lean();
  return orders.flatMap((o) =>
    o.items
      .filter((i) => String(i.instructor) === String(instructorId))
      .map((item) => ({ ...o, items: item, paidAt: o.paidAt || o.createdAt }))
  );
}

export async function dashboard(req, res) {
  const id = req.user._id;
  const pct = await share();
  const now = Date.now();
  const since12w = new Date(now - 120 * 864e5);
  const [courses, sales, recentReviews, openQuestions, newStudents30, newStudentsPrev] = await Promise.all([
    Course.find({ instructor: id }).select("_id title ratingAvg ratingCount studentsCount status").lean(),
    instructorSales(id, { paidAt: { $gte: since12w } }),
    Review.find({ course: { $in: await Course.find({ instructor: id }).distinct("_id") } })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("user", "name avatar")
      .populate("course", "title")
      .lean(),
    Question.find({ course: { $in: await Course.find({ instructor: id }).distinct("_id") }, answered: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name avatar")
      .populate("course", "title")
      .lean(),
    Enrollment.countDocuments({
      course: { $in: await Course.find({ instructor: id }).distinct("_id") },
      createdAt: { $gte: new Date(now - 30 * 864e5) },
    }),
    Enrollment.countDocuments({
      course: { $in: await Course.find({ instructor: id }).distinct("_id") },
      createdAt: { $gte: new Date(now - 60 * 864e5), $lt: new Date(now - 30 * 864e5) },
    }),
  ]);
  const weeks = Array.from({ length: 12 }, (_, i) => ({ week: i + 1, revenue: 0 }));
  for (const s of sales) {
    const idx = 11 - Math.floor((now - new Date(s.paidAt).getTime()) / (7 * 864e5));
    if (idx >= 0 && idx < 12) weeks[idx].revenue += s.items.price * pct;
  }
  const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
  const daily = Array.from({ length: 120 }, (_, i) => ({ date: dayKey(now - (119 - i) * 864e5), parts: [0, 0] }));
  const dayIndex = new Map(daily.map((d, i) => [d.date, i]));
  const top = courses.slice().sort((a, b) => b.studentsCount - a.studentsCount)[0];
  for (const s of sales) {
    const i = dayIndex.get(dayKey(s.paidAt));
    if (i === undefined) continue;
    daily[i].parts[top && String(s.items.course) === String(top._id) ? 0 : 1] += round2(s.items.price * pct);
  }
  const last30 = sales.filter((s) => now - new Date(s.paidAt).getTime() < 30 * 864e5);
  const prev30 = sales.filter((s) => {
    const age = now - new Date(s.paidAt).getTime();
    return age >= 30 * 864e5 && age < 60 * 864e5;
  });
  const sum = (arr) => round2(arr.reduce((t, s) => t + s.items.price * pct, 0));
  const byCourse = {};
  for (const s of last30) byCourse[s.items.title] = (byCourse[s.items.title] || 0) + s.items.price * pct;
  const rated = courses.filter((c) => c.ratingCount);
  const refunds = await Order.countDocuments({ status: "refunded", "items.instructor": id, updatedAt: { $gte: new Date(now - 30 * 864e5) } });

  res.json({
    success: true,
    data: {
      revenue30: sum(last30),
      revenuePrev30: sum(prev30),
      newStudents30,
      newStudentsPrev,
      rating: rated.length ? round2(rated.reduce((t, c) => t + c.ratingAvg, 0) / rated.length) : 0,
      reviewsCount: rated.reduce((t, c) => t + c.ratingCount, 0),
      refundRate: last30.length ? round2((refunds / (last30.length + refunds)) * 100) : 0,
      totalStudents: courses.reduce((t, c) => t + c.studentsCount, 0),
      weekly: weeks.map((w) => ({ ...w, revenue: round2(w.revenue) })),
      daily: daily.map((d) => ({ ...d, parts: d.parts.map(round2) })),
      dailySegments: [top?.title || "Top course", "Other courses"],
      byCourse: Object.entries(byCourse)
        .map(([title, revenue]) => ({ title, revenue: round2(revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      recentReviews,
      openQuestions,
      courses: courses.length,
    },
  });
}

export async function students(req, res) {
  const courseIds = await Course.find({ instructor: req.user._id }).distinct("_id");
  const filter = { course: { $in: courseIds }, revoked: false };
  if (req.query.course && mongoose.isValidObjectId(req.query.course)) filter.course = req.query.course;
  const items = await Enrollment.find(filter)
    .sort({ lastActiveAt: -1 })
    .limit(200)
    .populate("user", "name email avatar")
    .populate("course", "title")
    .lean();
  const q = String(req.query.q || "").toLowerCase();
  res.json({
    success: true,
    data: items
      .filter((e) => e.user && (!q || e.user.name.toLowerCase().includes(q) || e.user.email.includes(q)))
      .map((e) => ({
        id: e._id,
        user: e.user,
        course: e.course,
        progress: e.progress,
        lastActiveAt: e.lastActiveAt,
        enrolledAt: e.createdAt,
        completedAt: e.completedAt,
      })),
  });
}

export async function questions(req, res) {
  const courseIds = await Course.find({ instructor: req.user._id }).distinct("_id");
  const filter = { course: { $in: courseIds } };
  if (req.query.status === "open") filter.answered = false;
  if (req.query.status === "answered") filter.answered = true;
  const items = await Question.find(filter)
    .sort({ answered: 1, createdAt: -1 })
    .limit(100)
    .populate("user", "name avatar")
    .populate("course", "title")
    .populate("lesson", "title")
    .populate("answers.user", "name avatar role")
    .lean();
  res.json({ success: true, data: items });
}

export async function reviews(req, res) {
  const filter = { instructor: req.user._id };
  if (req.query.course && mongoose.isValidObjectId(req.query.course)) filter._id = req.query.course;
  const courses = await Course.find(filter).select("title slug ratingAvg ratingCount").lean();
  const query = { course: { $in: courses.map((c) => c._id) } };
  if (req.query.rating) query.rating = Number(req.query.rating);
  const items = await Review.find(query).sort({ createdAt: -1 }).limit(200).populate("user", "name avatar").lean();
  const byId = Object.fromEntries(courses.map((c) => [String(c._id), c]));
  const all = await Review.find({ course: { $in: courses.map((c) => c._id) } }).select("rating").lean();
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({ rating: n, count: all.filter((r) => r.rating === n).length }));
  const average = all.length ? Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10 : 0;
  res.json({
    success: true,
    data: {
      items: items.map((r) => ({ ...r, course: byId[String(r.course)] })),
      courses,
      summary: { average, total: all.length, breakdown },
    },
  });
}

export async function earnings(req, res) {
  const pct = await share();
  const now = Date.now();
  const [sales, payouts, user] = await Promise.all([
    instructorSales(req.user._id),
    Payout.find({ instructor: req.user._id }).sort({ createdAt: -1 }).lean(),
    User.findById(req.user._id).select("payoutUpi"),
  ]);
  const holdMs = 30 * 864e5;
  const lifetime = round2(sales.reduce((t, s) => t + s.items.price * pct, 0));
  const pending = round2(
    sales.filter((s) => now - new Date(s.paidAt).getTime() < holdMs).reduce((t, s) => t + s.items.price * pct, 0)
  );
  const paidOut = round2(payouts.filter((p) => p.status !== "rejected").reduce((t, p) => t + p.amount, 0));
  const monthly = {};
  for (const s of sales) {
    const key = new Date(s.paidAt || s.createdAt).toISOString().slice(0, 7);
    monthly[key] = round2((monthly[key] || 0) + s.items.price * pct);
  }
  res.json({
    success: true,
    data: {
      share: pct * 100,
      lifetime,
      pending,
      available: Math.max(0, round2(lifetime - pending - paidOut)),
      paidOut,
      monthly: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, amount]) => ({ month, amount })),
      payouts,
      payoutUpi: user.payoutUpi,
    },
  });
}

export async function requestPayout(req, res) {
  const upi = String(req.body.upi || "").trim();
  if (!/^[\w.-]{2,}@[a-z]{2,}$/i.test(upi)) throw ApiError.badRequest("Enter a valid UPI ID like name@bank");
  const pct = await share();
  const now = Date.now();
  const sales = await instructorSales(req.user._id);
  const lifetime = sales.reduce((t, s) => t + s.items.price * pct, 0);
  const pending = sales
    .filter((s) => now - new Date(s.paidAt).getTime() < 30 * 864e5)
    .reduce((t, s) => t + s.items.price * pct, 0);
  const paid = (await Payout.find({ instructor: req.user._id, status: { $ne: "rejected" } }).lean()).reduce(
    (t, p) => t + p.amount,
    0
  );
  const available = round2(lifetime - pending - paid);
  if (available < 500) throw ApiError.badRequest("You need at least ₹500 available to withdraw");
  await User.updateOne({ _id: req.user._id }, { payoutUpi: upi });
  const payout = await Payout.create({
    instructor: req.user._id,
    amount: available,
    tds: round2(available * 0.01),
    method: "UPI",
    destination: upi,
  });
  emitToAdmins("payout:requested", { id: payout._id });
  res.status(201).json({ success: true, message: `Withdrawal of ₹${available} requested`, data: payout });
}
