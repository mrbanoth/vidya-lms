import { OAuth2Client } from "google-auth-library";
import { User, Session, Setting } from "../../models/index.js";
import env from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { otp, randomToken, sha256, safeEqual } from "../../utils/crypto.js";
import { sendEmail, templates } from "../../utils/email.js";
import { REFRESH_COOKIE, refreshCookieOptions } from "../../utils/tokens.js";
import { createSession, rotateSession, revokeByToken } from "./auth.service.js";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

function sendSession(res, user, { accessToken, refreshToken }, status = 200) {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(status).json({ success: true, data: { user, accessToken } });
}

async function issueVerifyCode(user) {
  const code = otp();
  user.verifyCodeHash = sha256(code);
  user.verifyCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendEmail(user.email, templates.verify(user.name, code));
  return code;
}

export async function register(req, res) {
  const { name, email, password, role } = req.body;
  const settings = await Setting.get();
  if (role === "instructor" && !settings.features.instructorSignup)
    throw ApiError.forbidden("Instructor signups are paused right now");
  if (await User.exists({ email })) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password, role });
  const code = await issueVerifyCode(user);
  res.status(201).json({
    success: true,
    message: "Account created. Check your email for the 6-digit code.",
    data: { email: user.email, ...(env.isTest && { code }) },
  });
}

export async function verifyEmail(req, res) {
  const { email, code } = req.body;
  const user = await User.findOne({ email }).select("+verifyCodeHash +verifyCodeExpires");
  if (!user) throw ApiError.badRequest("That code is not valid");
  if (!user.isVerified) {
    const valid =
      user.verifyCodeHash &&
      user.verifyCodeExpires > new Date() &&
      safeEqual(user.verifyCodeHash, sha256(code));
    if (!valid) throw ApiError.badRequest("That code is wrong or expired. Request a new one.");
    user.isVerified = true;
    user.verifyCodeHash = undefined;
    user.verifyCodeExpires = undefined;
    user.lastLoginAt = new Date();
    await user.save();
  }
  sendSession(res, user, await createSession(user, req));
}

export async function resendCode(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.isVerified) await issueVerifyCode(user);
  res.json({ success: true, message: "If the account needs verifying, a new code is on its way." });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password +failedLogins +lockUntil");
  const generic = ApiError.unauthorized("Email or password is incorrect");
  if (!user || user.deletedAt) throw generic;
  if (user.lockUntil && user.lockUntil > new Date())
    throw new ApiError(423, `Too many failed attempts. Try again after ${LOCK_MINUTES} minutes.`);

  if (!(await user.checkPassword(password))) {
    user.failedLogins = (user.failedLogins || 0) + 1;
    if (user.failedLogins >= MAX_FAILED) {
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLogins = 0;
    }
    await user.save();
    throw generic;
  }
  if (user.status === "banned") throw ApiError.forbidden("This account is suspended. Contact support.");
  if (!user.isVerified) {
    await issueVerifyCode(user);
    return res
      .status(403)
      .json({ success: false, code: "EMAIL_NOT_VERIFIED", message: "Verify your email first. We sent a new code." });
  }
  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  sendSession(res, user, await createSession(user, req));
}

export async function google(req, res) {
  const settings = await Setting.get();
  if (!googleClient || !settings.features.googleLogin)
    throw ApiError.badRequest("Google sign-in is not enabled");
  const ticket = await googleClient
    .verifyIdToken({ idToken: req.body.credential, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => {
      throw ApiError.unauthorized("Google sign-in failed. Try again.");
    });
  const p = ticket.getPayload();
  if (!p?.email_verified) throw ApiError.unauthorized("Your Google email is not verified");

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({
      name: p.name || p.email.split("@")[0],
      email: p.email,
      googleId: p.sub,
      avatar: p.picture || "",
      isVerified: true,
    });
  } else {
    if (user.status === "banned") throw ApiError.forbidden("This account is suspended");
    user.googleId ||= p.sub;
    user.isVerified = true;
    if (!user.avatar && p.picture) user.avatar = p.picture;
  }
  user.lastLoginAt = new Date();
  await user.save();
  sendSession(res, user, await createSession(user, req));
}

export async function refresh(req, res) {
  const loadUser = (id) => User.findById(id);
  try {
    const result = await rotateSession(req.cookies?.[REFRESH_COOKIE], req, loadUser);
    sendSession(res, result.user, result);
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    throw err;
  }
}

export async function logout(req, res) {
  await revokeByToken(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true, message: "Signed out" });
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.deletedAt) {
    const token = randomToken(32);
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    await sendEmail(user.email, templates.reset(user.name, `${env.CLIENT_URL}/reset-password?token=${token}`));
    if (env.isTest) res.locals.resetToken = token;
  }
  res.json({
    success: true,
    message: "If an account exists for that email, a reset link is on its way.",
    ...(env.isTest && res.locals.resetToken && { data: { token: res.locals.resetToken } }),
  });
}

export async function resetPassword(req, res) {
  const user = await User.findOne({
    resetTokenHash: sha256(req.body.token),
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) throw ApiError.badRequest("This reset link is invalid or expired. Request a new one.");
  user.password = req.body.password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.isVerified = true;
  await user.save();
  await Session.updateMany({ user: user._id }, { revoked: true });
  res.json({ success: true, message: "Password updated. Sign in with your new password." });
}

export async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
