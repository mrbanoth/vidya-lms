import { Router } from "express";
import { checkoutSchema, couponCheckSchema, verifyPaymentSchema, refundRequestSchema } from "@vidya/shared";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as c from "./commerce.controller.js";

const r = Router();

r.post("/checkout/quote", authenticate, validate(couponCheckSchema.partial({ code: true })), c.quote);
r.post("/checkout", authenticate, validate(checkoutSchema), c.checkout);
r.post("/checkout/verify", authenticate, validate(verifyPaymentSchema.passthrough()), c.verify);
r.post("/checkout/:id/failed", authenticate, c.markFailed);

r.get("/orders", authenticate, c.myOrders);
r.get("/orders/:id", authenticate, c.getOrder);
r.post("/orders/:id/refund", authenticate, validate(refundRequestSchema), c.requestRefund);

export default r;
