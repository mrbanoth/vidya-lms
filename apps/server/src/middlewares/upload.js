import multer from "multer";
import ApiError from "../utils/ApiError.js";

const KINDS = {
  image: { types: ["image/jpeg", "image/png", "image/webp"], max: 5 * 1024 * 1024 },
  video: { types: ["video/mp4", "video/webm", "video/quicktime"], max: 500 * 1024 * 1024 },
  file: {
    types: ["application/pdf", "application/zip", "application/x-zip-compressed", "text/plain"],
    max: 25 * 1024 * 1024,
  },
};

export const upload = (kind) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: KINDS[kind].max, files: 1 },
    fileFilter: (_req, file, cb) =>
      KINDS[kind].types.includes(file.mimetype)
        ? cb(null, true)
        : cb(ApiError.badRequest(`Unsupported file type. Use ${KINDS[kind].types.join(", ")}`)),
  }).single("file");
