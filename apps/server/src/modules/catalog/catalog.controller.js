import mongoose from "mongoose";
import { Category, Course, Enrollment, Lesson, Review, User } from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import { escapeRegex, pageMeta } from "../../utils/paginate.js";
import { sendEmail, templates } from "../../utils/email.js";
import { Setting } from "../../models/index.js";

export const CARD_FIELDS =
  "title slug subtitle thumbnail color price discountPrice level language ratingAvg ratingCount studentsCount totalLessons totalDuration bestseller instructor category updatedAt";

const SORTS = {
  popular: { studentsCount: -1, ratingAvg: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
  newest: { publishedAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
};

export async function listCourses(req, res) {
  const q = req.valid.query;
  const filter = { status: "published" };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    const instructors = await User.find({ name: rx, role: "instructor" }).distinct("_id");
    filter.$or = [{ title: rx }, { subtitle: rx }, { instructor: { $in: instructors } }];
  }
  if (q.category) {
    const ids = q.category.split(",");
    const cats = await Category.find({
      $or: [{ slug: { $in: ids } }, ...ids.filter(mongoose.isValidObjectId).map((id) => ({ _id: id }))],
    }).distinct("_id");
    filter.category = { $in: cats };
  }
  if (q.level) filter.level = { $in: [].concat(q.level) };
  if (q.price === "free") filter.price = 0;
  if (q.price === "paid") filter.price = { $gt: 0 };
  if (q.rating) filter.ratingAvg = { $gte: q.rating };
  if (q.instructor) filter.instructor = q.instructor;

  const [items, total] = await Promise.all([
    Course.find(filter)
      .select(CARD_FIELDS)
      .populate("instructor", "name avatar")
      .populate("category", "name slug")
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean({ virtuals: true }),
    Course.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(total, q.page, q.limit) });
}

/** Course cards by id, for a signed-out visitor's local cart. */
export async function batch(req, res) {
  const ids = String(req.query.ids || "")
    .split(",")
    .filter((id) => mongoose.isValidObjectId(id))
    .slice(0, 20);
  const items = await Course.find({ _id: { $in: ids }, status: "published" })
    .select(CARD_FIELDS)
    .populate("instructor", "name avatar")
    .populate("category", "name slug")
    .lean();
  res.json({ success: true, data: items });
}

export async function featured(_req, res) {
  const [bestsellers, newest, categories, stats] = await Promise.all([
    Course.find({ status: "published" })
      .select(CARD_FIELDS)
      .populate("instructor", "name avatar")
      .populate("category", "name slug")
      .sort({ studentsCount: -1 })
      .limit(8)
      .lean(),
    Course.find({ status: "published" })
      .select(CARD_FIELDS)
      .populate("instructor", "name avatar")
      .populate("category", "name slug")
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean(),
    Category.find().sort({ featured: -1, courseCount: -1 }).limit(8).lean(),
    Promise.all([
      Course.countDocuments({ status: "published" }),
      User.countDocuments({ role: "student", deletedAt: null }),
      User.countDocuments({ role: "instructor", deletedAt: null }),
    ]),
  ]);
  const rated = await Course.find({ status: "published", ratingCount: { $gt: 0 } }).select("ratingAvg ratingCount").lean();
  const ratingWeight = rated.reduce((t, c) => t + c.ratingCount, 0);
  const avgRating = ratingWeight ? Math.round((rated.reduce((t, c) => t + c.ratingAvg * c.ratingCount, 0) / ratingWeight) * 10) / 10 : 0;
  const reviews = await Review.find({ rating: 5, comment: { $ne: "" }, hidden: false })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("user", "name avatar headline")
    .lean();
  res.json({
    success: true,
    data: {
      bestsellers,
      newest,
      categories,
      reviews,
      stats: { courses: stats[0], learners: stats[1], instructors: stats[2], avgRating },
    },
  });
}

export async function listCategories(_req, res) {
  const cats = await Category.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: cats });
}

export async function getCategory(req, res) {
  const cat = await Category.findOne({ slug: req.params.slug }).lean();
  if (!cat) throw ApiError.notFound("Category not found");
  res.json({ success: true, data: cat });
}

/** Public course page: details, curriculum outline (no private video URLs), owner flag. */
export async function getCourse(req, res) {
  const course = await Course.findOne({ slug: req.params.slug })
    .populate("instructor", "name avatar headline bio github linkedin website")
    .populate("category", "name slug")
    .lean({ virtuals: true });
  if (!course) throw ApiError.notFound("Course not found");

  const isOwner = req.user && String(course.instructor._id) === String(req.user._id);
  const isAdmin = req.user?.role === "admin";
  if (course.status !== "published" && !isOwner && !isAdmin) throw ApiError.notFound("Course not found");

  const lessonIds = course.sections.flatMap((s) => s.lessons);
  const lessons = await Lesson.find({ _id: { $in: lessonIds } })
    .select("title type duration isPreview videoUrl")
    .lean();
  const byId = new Map(lessons.map((l) => [String(l._id), l]));
  course.sections = course.sections.map((s) => ({
    _id: s._id,
    title: s.title,
    lessons: s.lessons
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .map((l) => ({ ...l, videoUrl: l.isPreview ? l.videoUrl : undefined })),
  }));

  const [enrollment, instructorStats, distribution] = await Promise.all([
    req.user ? Enrollment.findOne({ user: req.user._id, course: course._id, revoked: false }).lean() : null,
    Course.aggregate([
      { $match: { instructor: course.instructor._id, status: "published" } },
      {
        $group: {
          _id: null,
          courses: { $sum: 1 },
          students: { $sum: "$studentsCount" },
          ratingSum: { $sum: "$ratingAvg" },
        },
      },
    ]),
    Review.aggregate([
      { $match: { course: course._id, hidden: false } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);
  const inWishlist = req.user ? req.user.wishlist.some((id) => String(id) === String(course._id)) : false;
  const inCart = req.user ? req.user.cart.some((id) => String(id) === String(course._id)) : false;

  res.json({
    success: true,
    data: {
      ...course,
      instructorStats: instructorStats[0]
        ? {
            courses: instructorStats[0].courses,
            students: instructorStats[0].students,
            rating: Math.round((instructorStats[0].ratingSum / instructorStats[0].courses) * 10) / 10,
          }
        : { courses: 1, students: 0, rating: 0 },
      ratingDistribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: distribution.find((d) => d._id === star)?.count || 0,
      })),
      viewer: { enrolled: Boolean(enrollment), progress: enrollment?.progress || 0, isOwner, inWishlist, inCart },
    },
  });
}

export async function related(req, res) {
  const course = await Course.findOne({ slug: req.params.slug }).select("category instructor").lean();
  if (!course) throw ApiError.notFound();
  const items = await Course.find({
    status: "published",
    _id: { $ne: course._id },
    $or: [{ category: course.category }, { instructor: course.instructor }],
  })
    .select(CARD_FIELDS)
    .populate("instructor", "name avatar")
    .populate("category", "name slug")
    .sort({ studentsCount: -1 })
    .limit(4)
    .lean();
  res.json({ success: true, data: items });
}

export async function courseReviews(req, res) {
  const course = await Course.findOne({ slug: req.params.slug }).select("_id").lean();
  if (!course) throw ApiError.notFound();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const filter = { course: course._id, hidden: false };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name avatar")
      .lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(total, page, limit) });
}

export async function instructorProfile(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: { $in: ["instructor", "admin"] } })
    .select("name avatar headline bio website github linkedin createdAt")
    .lean();
  if (!user) throw ApiError.notFound("Instructor not found");
  const courses = await Course.find({ instructor: user._id, status: "published" })
    .select(CARD_FIELDS)
    .populate("instructor", "name avatar")
    .populate("category", "name slug")
    .lean();
  const students = courses.reduce((s, c) => s + c.studentsCount, 0);
  const rated = courses.filter((c) => c.ratingCount);
  const rating = rated.length ? rated.reduce((s, c) => s + c.ratingAvg, 0) / rated.length : 0;
  const reviews = rated.reduce((s, c) => s + c.ratingCount, 0);
  res.json({
    success: true,
    data: { ...user, courses, stats: { students, courses: courses.length, rating: Math.round(rating * 10) / 10, reviews } },
  });
}

export async function publicStats(_req, res) {
  const [courses, learners, instructors, completed] = await Promise.all([
    Course.countDocuments({ status: "published" }),
    User.countDocuments({ role: "student", deletedAt: null }),
    User.countDocuments({ role: "instructor", deletedAt: null }),
    Enrollment.countDocuments({ completedAt: { $ne: null } }),
  ]);
  const totalEnrollments = await Enrollment.countDocuments();
  res.json({
    success: true,
    data: {
      courses,
      learners,
      instructors,
      completionRate: totalEnrollments ? Math.round((completed / totalEnrollments) * 100) : 0,
    },
  });
}

export async function contact(req, res) {
  const settings = await Setting.get();
  await sendEmail(settings.supportEmail, templates.contact(req.body));
  res.json({ success: true, message: "Message sent. We reply within one working day." });
}
