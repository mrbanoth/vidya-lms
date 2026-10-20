import { Router } from "express";
import {
  progressSchema,
  noteSchema,
  quizAttemptSchema,
  questionSchema,
  answerSchema,
  reviewSchema,
} from "@vidya/shared";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as c from "./learn.controller.js";

const r = Router();
r.use(authenticate);

r.get("/my-courses", c.myCourses);
r.get("/:courseId", c.player);
r.get("/:courseId/lessons/:lessonId", c.lesson);
r.post("/:courseId/progress", validate(progressSchema), c.updateProgress);
r.post("/:courseId/lessons/:lessonId/quiz", validate(quizAttemptSchema), c.submitQuiz);

r.get("/:courseId/notes", c.listNotes);
r.post("/:courseId/notes", validate(noteSchema), c.addNote);
r.delete("/:courseId/notes/:noteId", c.deleteNote);

r.get("/:courseId/questions", c.listQuestions);
r.post("/:courseId/questions", validate(questionSchema), c.askQuestion);
r.post("/questions/:questionId/answers", validate(answerSchema), c.answerQuestion);

r.get("/:courseId/review", c.myReview);
r.put("/:courseId/review", validate(reviewSchema), c.upsertReview);

export default r;
