import { Category, Setting, User } from "../models/index.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

const STARTER_CATEGORIES = [
  { name: "Web Development", icon: "</>", featured: true, description: "Frontend, backend and full-stack development." },
  { name: "Data & AI", icon: "∑", featured: true, description: "Data analysis, machine learning and AI apps." },
  { name: "Mobile Apps", icon: "▢", featured: true, description: "Android, iOS and cross-platform apps." },
  { name: "UI/UX Design", icon: "◎", featured: true, description: "Interface design, research and design systems." },
  { name: "DevOps & Cloud", icon: "⇄", description: "CI/CD, containers and cloud platforms." },
  { name: "Career Skills", icon: "↗", description: "Interviews, communication and growth." },
];

/**
 * Runs on every start and is idempotent: creates platform settings, starter
 * categories on an empty database, and the first admin from ADMIN_* env vars.
 * No demo users, courses or orders are ever created here.
 */
export async function bootstrap() {
  const settings = await Setting.get();
  if (!settings.supportEmail && env.ADMIN_EMAIL) {
    settings.supportEmail = env.ADMIN_EMAIL.toLowerCase();
    await settings.save();
  }

  if ((await Category.countDocuments()) === 0) {
    await Category.create(STARTER_CATEGORIES);
    logger.info("Created starter categories");
  }

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const existing = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    if (!existing) {
      await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: "admin",
        isVerified: true,
      });
      logger.info({ email: env.ADMIN_EMAIL }, "Created first admin account");
    } else if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      logger.info({ email: env.ADMIN_EMAIL }, "Promoted existing account to admin");
    }
  } else if (!(await User.exists({ role: "admin" }))) {
    logger.warn("No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD and restart.");
  }
}
