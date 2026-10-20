import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import env from "../config/env.js";
import { randomToken } from "../utils/crypto.js";

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "text/plain": ".txt",
};

/** Saves an uploaded file to Cloudinary when configured, otherwise to /uploads. */
export async function saveFile(file, folder = "misc") {
  if (env.cloudinaryEnabled) {
    const resourceType = file.mimetype.startsWith("video/")
      ? "video"
      : file.mimetype.startsWith("image/")
        ? "image"
        : "raw";
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `vidya/${folder}`, resource_type: resourceType }, (err, res) =>
          err ? reject(err) : resolve(res)
        )
        .end(file.buffer);
    });
    return { url: result.secure_url, duration: Math.round(result.duration || 0) };
  }
  const dir = path.join(UPLOAD_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomToken(6)}${EXT[file.mimetype] || ""}`;
  await fs.writeFile(path.join(dir, name), file.buffer);
  return { url: `/uploads/${folder}/${name}`, duration: 0 };
}
