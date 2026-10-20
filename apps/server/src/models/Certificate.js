import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    userName: String,
    courseTitle: String,
    instructorName: String,
    hours: Number,
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
