import { Router } from "express";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
  googleAuthSchema,
} from "@vidya/shared";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { authLimiter, otpLimiter } from "../../middlewares/rateLimit.js";
import * as c from "./auth.controller.js";

const r = Router();

r.post("/register", authLimiter, validate(registerSchema), c.register);
r.post("/verify-email", authLimiter, validate(verifyEmailSchema), c.verifyEmail);
r.post("/resend-code", otpLimiter, validate(emailOnlySchema), c.resendCode);
r.post("/login", authLimiter, validate(loginSchema), c.login);
r.post("/google", authLimiter, validate(googleAuthSchema), c.google);
r.post("/refresh", c.refresh);
r.post("/logout", c.logout);
r.post("/forgot-password", otpLimiter, validate(emailOnlySchema), c.forgotPassword);
r.post("/reset-password", authLimiter, validate(resetPasswordSchema), c.resetPassword);
r.get("/me", authenticate, c.me);

export default r;
