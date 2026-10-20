import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLE_LIST, LANGUAGES } from "@vidya/shared";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, index: true, sparse: true },
    role: { type: String, enum: ROLE_LIST, default: "student", index: true },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    avatar: { type: String, default: "" },
    headline: { type: String, default: "", maxlength: 120 },
    bio: { type: String, default: "", maxlength: 2000 },
    language: { type: String, enum: LANGUAGES, default: "English" },
    website: String,
    github: String,
    linkedin: String,
    isVerified: { type: Boolean, default: false },
    verifyCodeHash: { type: String, select: false },
    verifyCodeExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    notificationPrefs: {
      courseUpdates: { type: Boolean, default: true },
      qaReplies: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
    },
    streak: { count: { type: Number, default: 0 }, lastDay: String },
    payoutUpi: { type: String, default: "" },
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.checkPassword = function checkPassword(plain) {
  return this.password ? bcrypt.compare(plain, this.password) : false;
};

userSchema.methods.toJSON = function toJSON() {
  const o = this.toObject({ versionKey: false });
  for (const k of [
    "password",
    "verifyCodeHash",
    "verifyCodeExpires",
    "resetTokenHash",
    "resetTokenExpires",
    "failedLogins",
    "lockUntil",
    "googleId",
  ])
    delete o[k];
  return o;
};

export default mongoose.model("User", userSchema);
