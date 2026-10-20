import mongoose from "mongoose";
import multer from "multer";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import env from "../config/env.js";

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = Object.values(details)[0];
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `That ${field} is already taken` : "Duplicate value";
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) logger.error({ err, url: req.originalUrl }, "Unhandled error");
  if (!(err instanceof ApiError) && status >= 500 && env.isProd) message = "Something went wrong";

  res.status(status).json({ success: false, message, ...(details && { errors: details }) });
}
