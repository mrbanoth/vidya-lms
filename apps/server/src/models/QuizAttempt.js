import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [Number],
    score: Number,
    correct: Number,
    total: Number,
    passed: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", attemptSchema);
