import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/vidya"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
  CORS_ORIGINS: z.string().optional().default(""),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Vidya <no-reply@vidya.dev>"),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")).default(""),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters").optional().or(z.literal("")).default(""),
  ADMIN_NAME: z.string().default("Admin"),
  ALLOW_TEST_PAYMENTS: z.enum(["true", "false"]).default("false"),
  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const env = parsed.data;
export default Object.freeze({
  ...env,
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  allowedOrigins: [env.CLIENT_URL, ...env.CORS_ORIGINS.split(",").map((s) => s.trim())].filter(
    Boolean
  ),
  testPaymentsAllowed: env.NODE_ENV !== "production" || env.ALLOW_TEST_PAYMENTS === "true",
  paymentsLive: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
  cloudinaryEnabled: Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
  ),
});
