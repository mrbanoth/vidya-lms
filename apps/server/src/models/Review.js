import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "", maxlength: 2000 },
    helpful: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

/** Recomputes the course rating summary after a review changes. */
reviewSchema.statics.refreshCourseRating = async function refresh(courseId) {
  const Course = mongoose.model("Course");
  const reviews = await this.find({ course: courseId, hidden: false }).select("rating").lean();
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await Course.updateOne(
    { _id: courseId },
    { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count }
  );
};

export default mongoose.model("Review", reviewSchema);
