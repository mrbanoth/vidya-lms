import { Course, Enrollment, Lesson, Note, Question, QuizAttempt, Review } from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import { notify } from "../../services/notify.js";
import { maybeIssueCertificate, trackActivity } from "../../services/learning.js";
import { CARD_FIELDS } from "../catalog/catalog.controller.js";

/** Loads a course the viewer may study: enrolled learner, its instructor, or an admin. */
async function accessCourse(req, courseId) {
  const course = await Course.findById(courseId).populate("instructor", "name avatar headline");
  if (!course) throw ApiError.notFound("Course not found");
  const isOwner = String(course.instructor._id) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id, revoked: false });
  if (!enrollment && !isOwner && !isAdmin) throw ApiError.forbidden("Enroll in this course to open it");
  return { course, enrollment, isOwner };
}

const allLessonIds = (course) => course.sections.flatMap((s) => s.lessons.map(String));

export async function myCourses(req, res) {
  const enrollments = await Enrollment.find({ user: req.user._id, revoked: false })
    .sort({ lastActiveAt: -1 })
    .populate({
      path: "course",
      select: CARD_FIELDS,
      populate: { path: "instructor", select: "name avatar" },
    })
    .populate("lastLesson", "title")
    .lean();
  res.json({
    success: true,
    data: enrollments
      .filter((e) => e.course)
      .map((e) => ({
        id: e._id,
        course: e.course,
        progress: e.progress,
        completedAt: e.completedAt,
        lastLesson: e.lastLesson,
        lastActiveAt: e.lastActiveAt,
        enrolledAt: e.createdAt,
      })),
  });
}

export async function player(req, res) {
  const { course, enrollment } = await accessCourse(req, req.params.courseId);
  const lessons = await Lesson.find({ course: course._id }).select("title type duration isPreview").lean();
  const byId = new Map(lessons.map((l) => [String(l._id), l]));
  const done = new Set((enrollment?.completedLessons || []).map(String));
  res.json({
    success: true,
    data: {
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        instructor: course.instructor,
        color: course.color,
        totalLessons: course.totalLessons,
      },
      sections: course.sections.map((s) => ({
        _id: s._id,
        title: s.title,
        lessons: s.lessons
          .map((id) => byId.get(String(id)))
          .filter(Boolean)
          .map((l) => ({ ...l, completed: done.has(String(l._id)) })),
      })),
      progress: enrollment?.progress || 0,
      lastLesson: enrollment?.lastLesson || null,
      enrolled: Boolean(enrollment),
    },
  });
}

export async function lesson(req, res) {
  const { course, enrollment } = await accessCourse(req, req.params.courseId);
  if (!allLessonIds(course).includes(req.params.lessonId)) throw ApiError.notFound("Lesson not found");
  const l = await Lesson.findById(req.params.lessonId).lean();
  if (l.type === "quiz") {
    l.quiz.questions = l.quiz.questions.map(({ answer: _a, explanation: _e, ...q }) => q);
  }
  const best = l.type === "quiz"
    ? await QuizAttempt.findOne({ user: req.user._id, lesson: l._id }).sort({ score: -1 }).lean()
    : null;
  if (enrollment) {
    enrollment.lastLesson = l._id;
    enrollment.lastActiveAt = new Date();
    await enrollment.save();
  }
  res.json({
    success: true,
    data: {
      ...l,
      positionSec: enrollment?.positions?.get(String(l._id)) || 0,
      completed: enrollment ? enrollment.completedLessons.some((id) => String(id) === String(l._id)) : false,
      bestAttempt: best && { score: best.score, passed: best.passed },
    },
  });
}

async function recompute(enrollment, course) {
  const ids = new Set(allLessonIds(course));
  const done = enrollment.completedLessons.filter((id) => ids.has(String(id)));
  enrollment.progress = ids.size ? Math.round((done.length / ids.size) * 100) : 0;
  if (enrollment.progress === 100 && !enrollment.completedAt) enrollment.completedAt = new Date();
  await enrollment.save();
  return maybeIssueCertificate(enrollment);
}

export async function updateProgress(req, res) {
  const { course, enrollment } = await accessCourse(req, req.params.courseId);
  if (!enrollment) return res.json({ success: true, data: { progress: 0 } });
  const { lessonId, positionSec, completed } = req.body;
  if (!allLessonIds(course).includes(lessonId)) throw ApiError.notFound("Lesson not found");

  if (positionSec != null) {
    const prev = enrollment.positions.get(lessonId) || 0;
    enrollment.positions.set(lessonId, Math.floor(positionSec));
    const watched = Math.max(0, positionSec - prev);
    if (watched > 0 && watched < 600) await trackActivity(req.user._id, { minutes: watched / 60 });
  }
  let certificate = null;
  if (completed !== undefined) {
    const has = enrollment.completedLessons.some((id) => String(id) === lessonId);
    if (completed && !has) {
      enrollment.completedLessons.push(lessonId);
      await trackActivity(req.user._id, { lessons: 1 });
    }
    if (!completed && has) enrollment.completedLessons.pull(lessonId);
  }
  enrollment.lastLesson = lessonId;
  enrollment.lastActiveAt = new Date();
  certificate = await recompute(enrollment, course);
  res.json({
    success: true,
    data: {
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      certificate: certificate && enrollment.progress === 100 ? { code: certificate.code } : null,
    },
  });
}

/* ---------- quizzes ---------- */
export async function submitQuiz(req, res) {
  const { course, enrollment } = await accessCourse(req, req.params.courseId);
  const l = await Lesson.findOne({ _id: req.params.lessonId, course: course._id, type: "quiz" }).lean();
  if (!l) throw ApiError.notFound("Quiz not found");
  const questions = l.quiz.questions;
  const answers = req.body.answers.slice(0, questions.length);
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= l.quiz.passScore;
  await QuizAttempt.create({
    user: req.user._id,
    lesson: l._id,
    course: course._id,
    answers,
    score,
    correct,
    total: questions.length,
    passed,
  });
  if (passed && enrollment && !enrollment.completedLessons.some((id) => String(id) === String(l._id))) {
    enrollment.completedLessons.push(l._id);
    await recompute(enrollment, course);
    await trackActivity(req.user._id, { lessons: 1 });
  }
  res.json({
    success: true,
    data: {
      score,
      correct,
      total: questions.length,
      passed,
      passScore: l.quiz.passScore,
      progress: enrollment?.progress,
      review: questions.map((q, i) => ({
        text: q.text,
        options: q.options,
        answer: q.answer,
        chosen: answers[i] ?? -1,
        explanation: q.explanation,
      })),
    },
  });
}

/* ---------- notes ---------- */
export async function listNotes(req, res) {
  await accessCourse(req, req.params.courseId);
  const filter = { user: req.user._id, course: req.params.courseId };
  if (req.query.lessonId) filter.lesson = req.query.lessonId;
  const notes = await Note.find(filter).sort({ lesson: 1, timeSec: 1 }).populate("lesson", "title").lean();
  res.json({ success: true, data: notes });
}
export async function addNote(req, res) {
  await accessCourse(req, req.params.courseId);
  const note = await Note.create({
    user: req.user._id,
    course: req.params.courseId,
    lesson: req.body.lessonId,
    timeSec: req.body.timeSec,
    body: req.body.body,
  });
  res.status(201).json({ success: true, data: note });
}
export async function deleteNote(req, res) {
  const r = await Note.deleteOne({ _id: req.params.noteId, user: req.user._id });
  if (!r.deletedCount) throw ApiError.notFound("Note not found");
  res.json({ success: true });
}

/* ---------- Q&A ---------- */
export async function listQuestions(req, res) {
  await accessCourse(req, req.params.courseId);
  const filter = { course: req.params.courseId };
  if (req.query.lessonId) filter.lesson = req.query.lessonId;
  const items = await Question.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name avatar")
    .populate("answers.user", "name avatar role")
    .populate("lesson", "title")
    .lean();
  res.json({ success: true, data: items });
}
export async function askQuestion(req, res) {
  const { course } = await accessCourse(req, req.params.courseId);
  const q = await Question.create({
    course: course._id,
    lesson: req.body.lessonId,
    user: req.user._id,
    title: req.body.title,
    body: req.body.body,
  });
  await notify(course.instructor._id, {
    type: "qa",
    title: `New question in ${course.title}`,
    body: q.title,
    link: "/studio/qa",
  });
  res.status(201).json({ success: true, data: await q.populate("user", "name avatar") });
}
export async function answerQuestion(req, res) {
  const q = await Question.findById(req.params.questionId).populate("course", "instructor title");
  if (!q) throw ApiError.notFound("Question not found");
  const { isOwner } = await accessCourse(req, q.course._id);
  q.answers.push({ user: req.user._id, body: req.body.body, isInstructor: isOwner });
  if (isOwner) q.answered = true;
  await q.save();
  if (String(q.user) !== String(req.user._id)) {
    await notify(q.user, {
      type: "qa",
      title: `${req.user.name} answered your question`,
      body: q.title,
      link: `/learn/${q.course._id}?tab=qa`,
    });
  }
  await q.populate([
    { path: "user", select: "name avatar" },
    { path: "answers.user", select: "name avatar role" },
  ]);
  res.json({ success: true, data: q });
}

/* ---------- reviews ---------- */
export async function myReview(req, res) {
  const review = await Review.findOne({ course: req.params.courseId, user: req.user._id }).lean();
  res.json({ success: true, data: review });
}
export async function upsertReview(req, res) {
  const { course, enrollment } = await accessCourse(req, req.params.courseId);
  if (!enrollment) throw ApiError.forbidden("Only enrolled learners can review");
  const review = await Review.findOneAndUpdate(
    { course: course._id, user: req.user._id },
    { rating: req.body.rating, comment: req.body.comment || "" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Review.refreshCourseRating(course._id);
  await notify(course.instructor._id, {
    type: "review",
    title: `New ${req.body.rating}★ review`,
    body: course.title,
    link: "/studio",
  });
  res.json({ success: true, message: "Thanks for the review", data: review });
}
