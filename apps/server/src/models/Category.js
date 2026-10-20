import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    icon: { type: String, default: "" },
    description: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    courseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
categorySchema.pre("validate", function setSlug(next) {
  if (this.isModified("name")) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.model("Category", categorySchema);
