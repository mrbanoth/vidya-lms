import mongoose from "mongoose";
import slugify from "slugify";
import { LEVELS, LANGUAGES, COURSE_STATUS } from "@vidya/shared";
import { randomToken } from "../utils/crypto.js";

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 90 },
    slug: { type: String, unique: true, index: true },
    subtitle: { type: String, default: "", maxlength: 160 },
    description: { type: String, default: "" },
    outcomes: [String],
    requirements: [String],
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    level: { type: String, enum: LEVELS, default: "Beginner" },
    language: { type: String, enum: LANGUAGES, default: "English" },
    price: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    thumbnail: { type: String, default: "" },
    promoVideo: { type: String, default: "" },
    color: { type: String, default: "#0f7a5c" },
    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
      index: true,
    },
    reviewNote: { type: String, default: "" },
    submittedAt: Date,
    publishedAt: Date,
    sections: [sectionSchema],
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
    bestseller: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.index({ title: "text", subtitle: "text" });
courseSchema.index({ status: 1, studentsCount: -1 });

courseSchema.virtual("isFree").get(function isFree() {
  return this.price === 0;
});

courseSchema.pre("validate", function setSlug(next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = `${slugify(this.title, { lower: true, strict: true }).slice(0, 70)}-${randomToken(3)}`;
  }
  next();
});

export default mongoose.model("Course", courseSchema);
