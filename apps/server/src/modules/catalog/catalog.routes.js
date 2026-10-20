import { Router } from "express";
import { courseQuerySchema, contactSchema } from "@vidya/shared";
import { validate } from "../../middlewares/validate.js";
import { optionalAuth } from "../../middlewares/auth.js";
import { authLimiter } from "../../middlewares/rateLimit.js";
import * as c from "./catalog.controller.js";

const r = Router();

r.get("/home", c.featured);
r.get("/stats", c.publicStats);
r.get("/categories", c.listCategories);
r.get("/categories/:slug", c.getCategory);
r.get("/courses-batch", c.batch);
r.get("/courses", validate(courseQuerySchema, "query"), c.listCourses);
r.get("/courses/:slug", optionalAuth, c.getCourse);
r.get("/courses/:slug/related", c.related);
r.get("/courses/:slug/reviews", c.courseReviews);
r.get("/instructors", c.listInstructors);
r.get("/instructors/:id", c.instructorProfile);
r.post("/contact", authLimiter, validate(contactSchema), c.contact);

export default r;
