import { Router } from "express";
import {
  couponSchema,
  categorySchema,
  reviewDecisionSchema,
  userAdminUpdateSchema,
  settingsSchema,
} from "@vidya/shared";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as c from "./admin.controller.js";

const r = Router();
r.use(authenticate, authorize("admin"));

r.get("/overview", c.overview);
r.get("/reports", c.reports);

r.get("/users", c.users);
r.patch("/users/:id", validate(userAdminUpdateSchema), c.updateUser);

r.get("/courses", c.reviewQueue);
r.post("/courses/:id/decision", validate(reviewDecisionSchema), c.decideCourse);
r.post("/courses/:id/bestseller", c.toggleBestseller);
r.post("/reviews/:id/toggle", c.hideReview);

r.get("/payments", c.payments);
r.post("/payments/:id/refund", validate(reviewDecisionSchema), c.decideRefund);
r.get("/payouts", c.payouts);
r.post("/payouts/:id", validate(reviewDecisionSchema), c.decidePayout);

r.get("/coupons", c.coupons);
r.post("/coupons", validate(couponSchema), c.createCoupon);
r.patch("/coupons/:id", validate(couponSchema.partial()), c.updateCoupon);
r.delete("/coupons/:id", c.deleteCoupon);

r.post("/categories", validate(categorySchema), c.createCategory);
r.patch("/categories/:id", validate(categorySchema.partial()), c.updateCategory);
r.delete("/categories/:id", c.deleteCategory);

r.get("/audit", c.auditLog);
r.get("/settings", c.getSettings);
r.patch("/settings", validate(settingsSchema), c.updateSettings);

export default r;
