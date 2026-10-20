import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import catalogRoutes from "./modules/catalog/catalog.routes.js";
import learnRoutes from "./modules/learn/learn.routes.js";
import certificateRoutes from "./modules/certificates/certificates.routes.js";
import commerceRoutes from "./modules/commerce/commerce.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import instructorRoutes from "./modules/instructor/instructor.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { maintenance } from "./middlewares/maintenance.js";
import { apiDocs } from "./docs/openapi.js";

const api = Router();

api.get("/health", (_req, res) =>
  res.json({
    success: true,
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "up" : "down",
    uptime: Math.round(process.uptime()),
  })
);
api.get("/docs", apiDocs);

api.use("/auth", authRoutes);
api.use("/admin", adminRoutes);
api.use(maintenance);
api.use("/users", userRoutes);
api.use("/", catalogRoutes);
api.use("/learn", learnRoutes);
api.use("/certificates", certificateRoutes);
api.use("/", commerceRoutes);
api.use("/notifications", notificationRoutes);
api.use("/instructor", instructorRoutes);

export default api;
