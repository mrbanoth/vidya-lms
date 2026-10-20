import mongoose from "mongoose";
import { LESSON_TYPES } from "@vidya/shared";

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: LESSON_TYPES, default: "video" },
    videoUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    content: { type: String, default: "" },
    isPreview: { type: Boolean, default: false },
    resources: [{ name: String, url: String }],
    quiz: {
      passScore: { type: Number, default: 80 },
      questions: [questionSchema],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);
