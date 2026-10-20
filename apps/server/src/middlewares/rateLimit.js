import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const make = (windowMin, max, message) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: env.isTest ? 10_000 : max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
  });

export const apiLimiter = make(15, 600, "Too many requests. Try again in a few minutes.");
export const authLimiter = make(15, 20, "Too many sign-in attempts. Wait 15 minutes and try again.");
export const otpLimiter = make(15, 6, "Too many codes requested. Wait 15 minutes and try again.");
