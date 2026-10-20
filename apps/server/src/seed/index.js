import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import {
  Activity, AuditLog, Category, Certificate, Coupon, Course, Enrollment, Lesson, Note,
  Notification, Order, Payout, Question, QuizAttempt, Review, Session, Setting, User,
} from "../models/index.js";
import { effectivePrice, priceCart } from "../utils/money.js";
import { randomToken } from "../utils/crypto.js";
import {
  CATEGORIES, COURSES, DESCRIPTION, INSTRUCTORS, QUESTIONS, REVIEW_TEXT, STUDENTS, defaultSections, video,
} from "./data.js";

const PASSWORD = "Password123";
const days = (n) => new Date(Date.now() - n * 864e5);
const pick = (arr, i) => arr[i % arr.length];

export async function seed({ quiet = false } = {}) {
  const log = (...a) => !quiet && console.log(...a);
  await Promise.all(
    [Activity, AuditLog, Category, Certificate, Coupon, Course, Enrollment, Lesson, Note, Notification,
      Order, Payout, Question, QuizAttempt, Review, Session, Setting, User].map((m) => m.deleteMany({}))
  );
  await Setting.create({ key: "platform" });

  const categories = await Category.create(CATEGORIES);
  log(`✓ ${categories.length} categories`);

  const admin = await User.create({ name: "Admin Ops", email: "admin@vidya.dev", password: PASSWORD, role: "admin", isVerified: true, lastLoginAt: new Date() });
  const instructors = [];
  for (const i of INSTRUCTORS) {
    instructors.push(await User.create({ ...i, password: PASSWORD, role: "instructor", isVerified: true, lastLoginAt: days(1), payoutUpi: `${i.email.split("@")[0]}@okhdfc` }));
  }
  const demo = await User.create({ name: "Sandeep Naik", email: "student@vidya.dev", password: PASSWORD, role: "student", isVerified: true, headline: "MERN developer in training", lastLoginAt: new Date() });
  const students = [demo];
  for (const [idx, name] of STUDENTS.entries()) {
    students.push(
      await User.create({
        name,
        email: `${name.split(" ")[0].toLowerCase()}@example.com`,
        password: PASSWORD,
        isVerified: true,
        createdAt: days(60 - idx * 4),
        lastLoginAt: days(idx % 9),
      })
    );
  }
  await User.create({ name: "Spam Account", email: "spam@example.net", password: PASSWORD, status: "banned", isVerified: true });
  log(`✓ ${2 + instructors.length + students.length} users`);

  const courses = [];
  for (const [ci, c] of COURSES.entries()) {
    const topic = c.topic || "MERN";
    const course = new Course({
      title: c.title,
      subtitle: c.subtitle,
      description: DESCRIPTION(c.title, topic),
      outcomes: c.outcomes || [`Understand the core ideas of ${topic}`, `Build a complete ${topic} project`, "Debug problems with confidence", "Follow patterns used by professional teams"],
      requirements: c.requirements || ["Comfort with basic programming", "A computer with internet access"],
      instructor: instructors[c.ins]._id,
      category: categories[c.cat]._id,
      level: c.level,
      price: c.price,
      discountPrice: c.discountPrice,
      color: c.color,
      bestseller: Boolean(c.bestseller),
      status: "published",
      publishedAt: days(120 - ci * 8),
      submittedAt: days(122 - ci * 8),
      sections: [],
    });
    let total = 0;
    let count = 0;
    for (const s of c.sections || defaultSections(topic)) {
      const ids = [];
      for (const l of s.lessons) {
        const lesson = await Lesson.create({
          course: course._id,
          type: "video",
          duration: 600,
          ...l,
          videoUrl: (l.type || "video") === "video" ? video() : "",
          resources: (l.type || "video") === "video" && ids.length === 0
            ? [{ name: "Starter code (GitHub)", url: "https://github.com/mrbanoth/vidya-lms" }]
            : [],
        });
        ids.push(lesson._id);
        total += lesson.duration;
        count += 1;
      }
      course.sections.push({ title: s.title, lessons: ids });
    }
    course.totalDuration = total;
    course.totalLessons = count;
    await course.save();
    categories[c.cat].courseCount += 1;
    courses.push(course);
  }
  await Promise.all(categories.map((c) => c.save()));

  // A draft and two courses waiting for review, so the studio and admin queue have content.
  for (const [k, extra] of [
    ["review", { title: "Next.js vs Vite SPA", ins: 0 }],
    ["review", { title: "Kotlin for Android Developers", ins: 3 }],
    ["draft", { title: "GraphQL with Apollo and Node", ins: 0 }],
  ]) {
    const course = await Course.create({
      title: extra.title,
      subtitle: "Coming soon to Vidya",
      description: DESCRIPTION(extra.title, extra.title),
      outcomes: ["Plan the architecture", "Build the core features", "Ship to production"],
      instructor: instructors[extra.ins]._id,
      category: categories[0]._id,
      level: "Intermediate",
      price: 2499,
      discountPrice: 599,
      status: k,
      submittedAt: k === "review" ? days(2) : undefined,
      sections: [{ title: "Introduction", lessons: [] }],
      color: "#285e8e",
    });
    const lessons = await Lesson.create([
      { course: course._id, title: "Welcome", duration: 300, videoUrl: video(), isPreview: true },
      { course: course._id, title: "Project setup", duration: 720, videoUrl: video() },
      { course: course._id, title: "First feature", duration: 900, videoUrl: video() },
    ]);
    course.sections[0].lessons = lessons.map((l) => l._id);
    course.totalLessons = 3;
    course.totalDuration = 1920;
    await course.save();
  }
  log(`✓ ${courses.length + 3} courses`);

  await Coupon.create([
    { code: "LEARN10", type: "percent", value: 10, createdBy: admin._id },
    { code: "DIWALI80", type: "percent", value: 80, maxUses: 1000, used: 842, expiresAt: new Date(Date.now() + 14 * 864e5), createdBy: admin._id },
    { code: "STUDENT40", type: "percent", value: 40, createdBy: admin._id },
    { code: "LAUNCH50", type: "percent", value: 50, maxUses: 500, used: 500, expiresAt: days(50), active: false, createdBy: admin._id },
  ]);

  // Enrollments, orders, reviews, progress
  const lessonsOf = async (course) => {
    const ids = course.sections.flatMap((s) => s.lessons);
    return Lesson.find({ _id: { $in: ids } }).lean().then((ls) => ids.map((id) => ls.find((l) => String(l._id) === String(id))));
  };
  let orders = 0;
  for (const [si, student] of students.entries()) {
    const own = si === 0 ? [0, 5, 3, 7] : [si % 12, (si * 5 + 1) % 12, (si * 7 + 3) % 12].filter((v, i, a) => a.indexOf(v) === i);
    for (const [k, ci] of own.entries()) {
      const course = courses[ci];
      const paidAt = days(si === 0 ? 50 - k * 12 : (si * 7 + k * 11) % 80);
      let orderId;
      if (course.price > 0) {
        const p = priceCart([course], null);
        const order = await Order.create({
          user: student._id,
          items: [{ course: course._id, instructor: course.instructor, title: course.title, price: effectivePrice(course) }],
          ...p,
          status: si === 3 && k === 0 ? "refund_requested" : "paid",
          gateway: "test",
          method: pick(["upi", "card", "netbanking"], si + k),
          paymentId: `test_pay_${randomToken(5)}`,
          invoiceNo: `VD-${paidAt.toISOString().slice(0, 10).replace(/-/g, "")}-${randomToken(3).toUpperCase()}`,
          paidAt,
          createdAt: paidAt,
          ...(si === 3 && k === 0 && { refund: { reason: "Bought the wrong course by mistake", requestedAt: days(1) } }),
        });
        orderId = order._id;
        orders += 1;
      }
      const ls = await lessonsOf(course);
      const ratio = si === 0 ? [0.55, 0.22, 0.41, 1][k] : pick([0.1, 0.35, 0.6, 0.85, 1, 0.5], si + k);
      const done = ls.slice(0, Math.round(ls.length * ratio));
      const progress = Math.round((done.length / ls.length) * 100);
      await Enrollment.create({
        user: student._id,
        course: course._id,
        order: orderId,
        pricePaid: effectivePrice(course),
        completedLessons: done.map((l) => l._id),
        lastLesson: (ls[done.length] || ls.at(-1))._id,
        progress,
        completedAt: progress === 100 ? days(3 + si) : undefined,
        lastActiveAt: days((si + k) % 10),
        createdAt: paidAt,
      });
      course.studentsCount += 1;
      if (progress === 100) {
        const ins = instructors.find((i) => String(i._id) === String(course.instructor));
        await Certificate.create({
          code: `VID-${randomToken(3).toUpperCase()}-${randomToken(2).toUpperCase()}-2026`,
          user: student._id, course: course._id, userName: student.name, courseTitle: course.title,
          instructorName: ins.name, hours: Math.max(1, Math.round(course.totalDuration / 3600)), issuedAt: days(3 + si),
        });
      }
      if (si > 0 && (si + k) % 3 !== 2) {
        await Review.create({ course: course._id, user: student._id, rating: (si + k) % 5 === 4 ? 4 : 5, comment: pick(REVIEW_TEXT, si + k), createdAt: days(si + k) });
      }
    }
  }
  // Extra paid volume so dashboards and charts have shape
  for (let w = 0; w < 80; w++) {
    const course = courses[w % courses.length];
    if (!course.price) continue;
    const buyer = students[1 + (w % (students.length - 1))];
    const paidAt = days(Math.floor(w * 1.05));
    await Order.create({
      user: buyer._id,
      items: [{ course: course._id, instructor: course.instructor, title: course.title, price: effectivePrice(course) }],
      ...priceCart([course], null),
      status: w % 23 === 7 ? "failed" : "paid",
      gateway: "test",
      method: pick(["upi", "card"], w),
      invoiceNo: `VD-H${w}-${randomToken(3).toUpperCase()}`,
      paidAt: w % 23 === 7 ? undefined : paidAt,
      createdAt: paidAt,
    });
    course.studentsCount += 37;
    orders += 1;
  }
  for (const c of courses) {
    const rs = await Review.find({ course: c._id }).lean();
    c.ratingCount = rs.length;
    c.ratingAvg = rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : 0;
    await c.save();
  }
  log(`✓ ${orders} orders, enrollments, reviews, certificates`);

  // Demo learner extras
  const mern = courses[0];
  const mernLessons = await lessonsOf(mern);
  await Note.create([
    { user: demo._id, course: mern._id, lesson: mernLessons[3]._id, timeSec: 220, body: "Use await inside try/catch, or let Express 5 forward the rejection." },
    { user: demo._id, course: mern._id, lesson: mernLessons[6]._id, timeSec: 95, body: "Controllers stay thin. Business logic goes in services." },
  ]);
  for (const [i, [title, body]] of QUESTIONS.entries()) {
    const q = await Question.create({ course: mern._id, lesson: mernLessons[3 + i]._id, user: students[1 + i]._id, title, body, createdAt: days(i) });
    if (i === 3) {
      q.answers.push({ user: instructors[0]._id, body: "Run `npm run seed` in apps/server. It wipes and fills the database with demo data.", isInstructor: true });
      q.answered = true;
      await q.save();
    }
  }
  const today = new Date();
  for (let d = 0; d < 84; d++) {
    const minutes = (d * 37 + 11) % 101 % 4 === 0 ? 0 : ((d * 13) % 60) + 10;
    if (minutes) await Activity.create({ user: demo._id, day: new Date(today - d * 864e5).toISOString().slice(0, 10), minutes, lessons: Math.ceil(minutes / 15) });
  }
  demo.streak = { count: 12, lastDay: today.toISOString().slice(0, 10) };
  demo.wishlist = [courses[10]._id, courses[1]._id];
  demo.cart = [courses[1]._id];
  await demo.save();
  await Notification.create([
    { user: demo._id, type: "qa", title: "Priya answered your question", body: "“How do I seed the database?”", link: `/learn/${mern._id}?tab=qa` },
    { user: demo._id, type: "course", title: "React 19 Deep Dive is 80% off", body: "A wishlist course is on sale", link: `/courses/${courses[1].slug}` },
    { user: demo._id, type: "course", title: "New lesson added", body: "MERN Stack · Deploy to Vercel and Render", link: `/learn/${mern._id}`, read: true },
    { user: instructors[0]._id, type: "qa", title: "New question in MERN Stack", body: QUESTIONS[0][0], link: "/studio/qa" },
  ]);

  await Payout.create([
    { instructor: instructors[0]._id, amount: 48200, tds: 482, destination: "priya@okhdfc", status: "paid", paidAt: days(19), reference: "UTR8812231" },
    { instructor: instructors[1]._id, amount: 21400, tds: 214, destination: "arjun@okhdfc", status: "requested" },
  ]);
  await AuditLog.create([
    { actor: admin._id, actorName: admin.name, action: "course.approve", targetType: "Course", targetLabel: courses[4].title, ip: "127.0.0.1", createdAt: days(0.1) },
    { actor: admin._id, actorName: admin.name, action: "coupon.create", targetType: "Coupon", targetLabel: "DIWALI80", ip: "127.0.0.1", createdAt: days(1) },
    { actorName: "System", action: "user.ban", targetType: "User", targetLabel: "spam@example.net", createdAt: days(2) },
    { actor: admin._id, actorName: admin.name, action: "settings.update", targetType: "Setting", targetLabel: "Revenue share 70%", ip: "127.0.0.1", createdAt: days(4) },
  ]);

  log("\nDemo accounts (password: Password123)");
  log("  student@vidya.dev     student");
  log("  priya@vidya.dev       instructor");
  log("  admin@vidya.dev       admin");
  return { admin, demo, instructors, courses };
}

if (process.argv[1]?.endsWith("seed/index.js")) {
  connectDB()
    .then(() => seed())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
