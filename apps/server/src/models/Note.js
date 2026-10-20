import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    timeSec: { type: Number, default: 0 },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);
noteSchema.index({ user: 1, course: 1 });

export default mongoose.model("Note", noteSchema);
