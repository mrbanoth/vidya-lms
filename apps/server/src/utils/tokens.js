import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const REFRESH_COOKIE = "vidya_rt";

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.COOKIE_SAMESITE === "none",
    sameSite: env.COOKIE_SAMESITE,
    path: "/api/v1/auth",
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  };
}
