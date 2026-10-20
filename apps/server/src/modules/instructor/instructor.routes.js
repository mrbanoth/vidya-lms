import { Router } from "express";
import {
  courseBasicsSchema,
  courseUpdateSchema,
  sectionSchema,
  lessonSchema,
  reorderSchema,
} from "@vidya/shared";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import ApiError from "../../utils/ApiError.js";
import * as c from "./instructor.controller.js";

const r = Router();
r.use(authenticate, authorize("instructor", "admin"));

const kindUpload = (map) => (req, res, next) => {
  const kind = map[req.params.kind];
  if (!kind) throw ApiError.badRequest("Unknown upload type");
  return upload(kind)(req, res, next);
};

r.get("/dashboard", c.dashboard);
r.get("/students", c.students);
r.get("/questions", c.questions);
r.get("/earnings", c.earnings);
r.post("/payouts", c.requestPayout);

r.get("/courses", c.listMine);
r.post("/courses", validate(courseBasicsSchema), c.create);
r.get("/courses/:id", c.getOne);
r.patch("/courses/:id", validate(courseUpdateSchema), c.update);
r.delete("/courses/:id", c.remove);
r.post("/courses/:id/media/:kind", kindUpload({ thumbnail: "image", promo: "video" }), c.uploadMedia);
r.get("/courses/:id/checklist", c.getChecklist);
r.post("/courses/:id/submit", c.submit);
r.post("/courses/:id/unpublish", c.unpublish);
r.put("/courses/:id/order", validate(reorderSchema), c.reorder);

r.post("/courses/:id/sections", validate(sectionSchema), c.addSection);
r.patch("/courses/:id/sections/:sectionId", validate(sectionSchema), c.updateSection);
r.delete("/courses/:id/sections/:sectionId", c.deleteSection);
r.post("/courses/:id/sections/:sectionId/lessons", validate(lessonSchema), c.addLesson);

r.patch("/lessons/:lessonId", validate(lessonSchema.partial()), c.updateLesson);
r.delete("/lessons/:lessonId", c.deleteLesson);
r.post("/lessons/:lessonId/upload/:kind", kindUpload({ video: "video", resource: "file" }), c.uploadLessonFile);

export default r;
