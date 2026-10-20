import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";
import User from "../models/User.js";

async function resolveUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Your session expired. Sign in again.");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.deletedAt) throw ApiError.unauthorized();
  if (user.status === "banned") throw ApiError.forbidden("This account is suspended");
  return user;
}

export async function authenticate(req, _res, next) {
  const user = await resolveUser(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
  } catch {
    req.user = null;
  }
  next();
}

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
