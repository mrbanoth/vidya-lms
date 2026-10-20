import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    pricePaid: { type: Number, default: 0 },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    lastLesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    positions: { type: Map, of: Number, default: {} },
    progress: { type: Number, default: 0 },
    completedAt: Date,
    lastActiveAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
