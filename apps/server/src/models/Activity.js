import mongoose from "mongoose";

/** Minutes studied per user per day, for streaks and the activity heatmap. */
const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  day: { type: String, required: true },
  minutes: { type: Number, default: 0 },
  lessons: { type: Number, default: 0 },
});
activitySchema.index({ user: 1, day: 1 }, { unique: true });

export default mongoose.model("Activity", activitySchema);
