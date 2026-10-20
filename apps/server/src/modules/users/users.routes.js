import { Router } from "express";
import { profileSchema, changePasswordSchema } from "@vidya/shared";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import * as c from "./users.controller.js";

const r = Router();
r.use(authenticate);

r.patch("/me", validate(profileSchema), c.updateProfile);
r.post("/me/avatar", upload("image"), c.uploadAvatar);
r.post("/me/password", validate(changePasswordSchema), c.changePassword);
r.get("/me/sessions", c.listSessions);
r.delete("/me/sessions/:id", c.revokeSession);
r.post("/me/delete", c.deleteAccount);
r.get("/me/stats", c.studentStats);

r.get("/me/wishlist", c.getWishlist);
r.post("/me/wishlist/:courseId", c.addWishlist);
r.delete("/me/wishlist/:courseId", c.removeWishlist);

r.get("/me/cart", c.getCart);
r.post("/me/cart/merge", c.mergeCart);
r.post("/me/cart/:courseId", c.addCart);
r.delete("/me/cart/:courseId", c.removeCart);

export default r;
