import { z } from "zod";
import { LEVELS, LESSON_TYPES, PASSWORD_MIN, LANGUAGES } from "./constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const email = z.string().trim().toLowerCase().email("Enter a valid email like name@example.com");
const password = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(128)
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

/* ---------- auth ---------- */
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(60),
  email,
  password,
  role: z.enum(["student", "instructor"]).default("student"),
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});
export const verifyEmailSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export const emailOnlySchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password,
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
});
export const googleAuthSchema = z.object({ credential: z.string().min(10) });

/* ---------- profile ---------- */
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  language: z.enum(LANGUAGES).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  github: z.string().trim().max(100).optional().or(z.literal("")),
  linkedin: z.string().trim().max(100).optional().or(z.literal("")),
  notificationPrefs: z
    .object({
      courseUpdates: z.boolean(),
      qaReplies: z.boolean(),
      promotions: z.boolean(),
      weeklyDigest: z.boolean(),
    })
    .partial()
    .optional(),
});

/* ---------- catalog ---------- */
export const courseQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  level: z.union([z.enum(LEVELS), z.array(z.enum(LEVELS))]).optional(),
  price: z.enum(["all", "free", "paid"]).default("all"),
  rating: z.coerce.number().min(0).max(5).optional(),
  instructor: objectId.optional(),
  sort: z.enum(["popular", "rating", "newest", "price-asc", "price-desc"]).default("popular"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

/* ---------- instructor ---------- */
export const courseBasicsSchema = z.object({
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(90),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  category: objectId,
  level: z.enum(LEVELS),
  language: z.enum(LANGUAGES).default("English"),
});
export const courseUpdateSchema = courseBasicsSchema.partial().extend({
  description: z.string().trim().max(10000).optional(),
  outcomes: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  requirements: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  price: z.coerce.number().min(0).max(100000).optional(),
  discountPrice: z.coerce.number().min(0).max(100000).nullable().optional(),
  thumbnail: z.string().trim().max(500).optional().or(z.literal("")),
  promoVideo: z.string().trim().max(500).optional().or(z.literal("")),
});
export const sectionSchema = z.object({ title: z.string().trim().min(2).max(120) });

const quizQuestionSchema = z.object({
  text: z.string().trim().min(3).max(500),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
  answer: z.number().int().min(0),
  explanation: z.string().trim().max(500).optional().or(z.literal("")),
});
export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(150),
  type: z.enum(LESSON_TYPES).default("video"),
  videoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  duration: z.coerce.number().int().min(0).max(36000).default(0),
  content: z.string().max(50000).optional().or(z.literal("")),
  isPreview: z.boolean().default(false),
  resources: z
    .array(z.object({ name: z.string().trim().min(1).max(120), url: z.string().trim().url() }))
    .max(10)
    .default([]),
  quiz: z
    .object({
      passScore: z.number().int().min(0).max(100).default(80),
      questions: z.array(quizQuestionSchema).max(50),
    })
    .optional(),
});
export const reorderSchema = z.object({
  sections: z.array(z.object({ id: objectId, lessons: z.array(objectId) })),
});

/* ---------- learning ---------- */
export const progressSchema = z.object({
  lessonId: objectId,
  positionSec: z.coerce.number().min(0).max(36000).optional(),
  completed: z.boolean().optional(),
});
export const noteSchema = z.object({
  lessonId: objectId,
  timeSec: z.coerce.number().min(0).max(36000).default(0),
  body: z.string().trim().min(1, "Write something first").max(2000),
});
export const quizAttemptSchema = z.object({
  answers: z.array(z.number().int().min(-1)).max(50),
});
export const questionSchema = z.object({
  lessonId: objectId.optional(),
  title: z.string().trim().min(5, "Make the question a bit longer").max(160),
  body: z.string().trim().max(5000).optional().or(z.literal("")),
});
export const answerSchema = z.object({ body: z.string().trim().min(2).max(5000) });
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

/* ---------- commerce ---------- */
export const checkoutSchema = z.object({
  courseIds: z.array(objectId).min(1).max(20),
  coupon: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
});
export const couponCheckSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(30),
  courseIds: z.array(objectId).min(1).max(20),
});
export const verifyPaymentSchema = z.object({
  orderId: objectId,
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
});
export const refundRequestSchema = z.object({ reason: z.string().trim().min(5).max(500) });

/* ---------- admin ---------- */
export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, - or _"),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().min(0).default(0),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
});
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  featured: z.boolean().default(false),
});
export const reviewDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});
export const userAdminUpdateSchema = z.object({
  role: z.enum(["student", "instructor", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
});
export const settingsSchema = z.object({
  platformName: z.string().trim().min(2).max(40).optional(),
  supportEmail: z.string().trim().email().optional(),
  revenueShare: z.coerce.number().min(0).max(100).optional(),
  features: z
    .object({
      instructorSignup: z.boolean(),
      requireReview: z.boolean(),
      googleLogin: z.boolean(),
      maintenance: z.boolean(),
    })
    .partial()
    .optional(),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60),
  email,
  topic: z.string().trim().max(60),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(3000),
});

export { objectId };
