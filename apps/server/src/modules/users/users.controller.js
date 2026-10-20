import { User, Session, Course, Enrollment, Activity } from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import { saveFile } from "../../services/storage.js";
import { sha256 } from "../../utils/crypto.js";
import { REFRESH_COOKIE } from "../../utils/tokens.js";
import { CARD_FIELDS } from "../catalog/catalog.controller.js";

export async function updateProfile(req, res) {
  const { notificationPrefs, ...rest } = req.body;
  Object.assign(req.user, rest);
  if (notificationPrefs) Object.assign(req.user.notificationPrefs, notificationPrefs);
  await req.user.save();
  res.json({ success: true, message: "Profile saved", data: { user: req.user } });
}

export async function uploadAvatar(req, res) {
  if (!req.file) throw ApiError.badRequest("Choose an image to upload");
  const { url } = await saveFile(req.file, "avatars");
  req.user.avatar = url;
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select("+password");
  if (user.password && !(await user.checkPassword(req.body.currentPassword)))
    throw ApiError.badRequest("Your current password is incorrect", {
      currentPassword: "Your current password is incorrect",
    });
  user.password = req.body.newPassword;
  await user.save();
  const current = req.cookies?.[REFRESH_COOKIE];
  await Session.updateMany(
    { user: user._id, ...(current && { tokenHash: { $ne: sha256(current) } }) },
    { revoked: true }
  );
  res.json({ success: true, message: "Password updated. Other devices were signed out." });
}

export async function listSessions(req, res) {
  const current = req.cookies?.[REFRESH_COOKIE];
  const sessions = await Session.find({
    user: req.user._id,
    revoked: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({
    success: true,
    data: sessions.map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ip: s.ip,
      lastUsed: s.updatedAt,
      current: Boolean(current) && s.tokenHash === sha256(current),
    })),
  });
}

export async function revokeSession(req, res) {
  const s = await Session.findOne({ _id: req.params.id, user: req.user._id });
  if (!s) throw ApiError.notFound("Session not found");
  await Session.updateMany({ family: s.family }, { revoked: true });
  res.json({ success: true, message: "Device signed out" });
}

export async function deleteAccount(req, res) {
  const user = await User.findById(req.user._id).select("+password");
  if (user.password && !(await user.checkPassword(req.body.password || "")))
    throw ApiError.badRequest("Password is incorrect");
  user.deletedAt = new Date();
  user.email = `deleted-${user._id}@deleted.vidya`;
  user.name = "Deleted user";
  user.googleId = undefined;
  await user.save();
  await Session.updateMany({ user: user._id }, { revoked: true });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.json({ success: true, message: "Account deleted" });
}

/* ---------- wishlist & cart ---------- */
async function listOf(user, field) {
  const doc = await User.findById(user._id).populate({
    path: field,
    match: { status: "published" },
    select: CARD_FIELDS,
    populate: [
      { path: "instructor", select: "name avatar" },
      { path: "category", select: "name slug" },
    ],
  });
  return doc[field];
}

export const getWishlist = async (req, res) =>
  res.json({ success: true, data: await listOf(req.user, "wishlist") });
export const getCart = async (req, res) =>
  res.json({ success: true, data: await listOf(req.user, "cart") });

const toggler = (field, add) => async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, status: "published" }).select("_id");
  if (!course) throw ApiError.notFound("Course not found");
  if (add && field === "cart" && (await Enrollment.exists({ user: req.user._id, course: course._id, revoked: false })))
    throw ApiError.conflict("You already own this course");
  await User.updateOne(
    { _id: req.user._id },
    add ? { $addToSet: { [field]: course._id } } : { $pull: { [field]: course._id } }
  );
  res.json({ success: true, data: await listOf(req.user, field) });
};
export const addWishlist = toggler("wishlist", true);
export const removeWishlist = toggler("wishlist", false);
export const addCart = toggler("cart", true);
export const removeCart = toggler("cart", false);

export async function mergeCart(req, res) {
  const ids = (req.body.courseIds || []).slice(0, 20);
  const owned = await Enrollment.find({ user: req.user._id, course: { $in: ids } }).distinct("course");
  const valid = await Course.find({ _id: { $in: ids, $nin: owned }, status: "published" }).distinct("_id");
  await User.updateOne({ _id: req.user._id }, { $addToSet: { cart: { $each: valid } } });
  res.json({ success: true, data: await listOf(req.user, "cart") });
}

/* ---------- dashboard stats ---------- */
export async function studentStats(req, res) {
  const since = new Date(Date.now() - 83 * 864e5).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
  const [enrollments, activity] = await Promise.all([
    Enrollment.find({ user: req.user._id, revoked: false }).select("progress completedAt").lean(),
    Activity.find({ user: req.user._id, day: { $gte: since } }).select("day minutes lessons -_id").lean(),
  ]);
  const minutesBetween = (from, to) =>
    activity.filter((a) => a.day >= from && (!to || a.day < to)).reduce((s, a) => s + a.minutes, 0);
  const user = await User.findById(req.user._id).select("streak");
  const lastDay = user.streak?.lastDay;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    success: true,
    data: {
      enrolled: enrollments.length,
      completed: enrollments.filter((e) => e.completedAt).length,
      hoursThisWeek: Math.round((minutesBetween(weekAgo) / 60) * 10) / 10,
      hoursLastWeek: Math.round((minutesBetween(twoWeeksAgo, weekAgo) / 60) * 10) / 10,
      streak: lastDay === today || lastDay === yesterday ? user.streak.count : 0,
      activity,
    },
  });
}
