import { Router } from "express";
import { Notification } from "../../models/index.js";
import { authenticate } from "../../middlewares/auth.js";

const r = Router();
r.use(authenticate);

r.get("/", async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === "true") filter.read = false;
  if (req.query.type) filter.type = String(req.query.type);
  const [items, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data: items, meta: { unread } });
});

r.patch("/read-all", async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

r.patch("/:id/read", async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
});

export default r;
