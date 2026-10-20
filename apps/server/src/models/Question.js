import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    isInstructor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    answers: [answerSchema],
    answered: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
