import { Activity, Certificate, Course, Enrollment, User } from "../models/index.js";
import { randomToken } from "../utils/crypto.js";
import { notify } from "./notify.js";

export const today = (d = new Date()) => d.toISOString().slice(0, 10);

export async function trackActivity(userId, { minutes = 0, lessons = 0 } = {}) {
  const day = today();
  await Activity.updateOne(
    { user: userId, day },
    { $inc: { minutes, lessons } },
    { upsert: true }
  );
  const user = await User.findById(userId).select("streak");
  if (!user || user.streak?.lastDay === day) return;
  const yesterday = today(new Date(Date.now() - 864e5));
  user.streak = {
    count: user.streak?.lastDay === yesterday ? (user.streak.count || 0) + 1 : 1,
    lastDay: day,
  };
  await user.save();
}

export async function enroll(userId, course, { order, pricePaid = 0 } = {}) {
  const existing = await Enrollment.findOne({ user: userId, course: course._id });
  if (existing) {
    if (existing.revoked) {
      existing.revoked = false;
      await existing.save();
    }
    return existing;
  }
  const enrollment = await Enrollment.create({
    user: userId,
    course: course._id,
    order,
    pricePaid,
  });
  await Course.updateOne({ _id: course._id }, { $inc: { studentsCount: 1 } });
  await User.updateOne({ _id: userId }, { $pull: { cart: course._id, wishlist: course._id } });
  return enrollment;
}

/** Issues a certificate once every lesson is complete. Idempotent. */
export async function maybeIssueCertificate(enrollment) {
  if (enrollment.progress < 100) return null;
  const existing = await Certificate.findOne({ user: enrollment.user, course: enrollment.course });
  if (existing) return existing;
  const [user, course] = await Promise.all([
    User.findById(enrollment.user).select("name"),
    Course.findById(enrollment.course).populate("instructor", "name"),
  ]);
  const code = `VID-${randomToken(3).toUpperCase()}-${randomToken(2).toUpperCase()}-${new Date().getFullYear()}`;
  const cert = await Certificate.create({
    code,
    user: user._id,
    course: course._id,
    userName: user.name,
    courseTitle: course.title,
    instructorName: course.instructor?.name,
    hours: Math.max(1, Math.round(course.totalDuration / 3600)),
  });
  await notify(user._id, {
    type: "certificate",
    title: "Certificate ready",
    body: `${course.title} · share it or download the PDF`,
    link: `/certificates/${code}`,
  });
  return cert;
}

/** Recomputes lesson count and total duration for a course. */
export async function refreshCourseTotals(courseId) {
  const { Lesson } = await import("../models/index.js");
  const course = await Course.findById(courseId);
  if (!course) return;
  const ids = course.sections.flatMap((s) => s.lessons);
  const lessons = await Lesson.find({ _id: { $in: ids } }).select("duration").lean();
  course.totalLessons = lessons.length;
  course.totalDuration = lessons.reduce((s, l) => s + (l.duration || 0), 0);
  await course.save();
}
