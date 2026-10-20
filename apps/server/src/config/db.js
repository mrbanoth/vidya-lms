import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

export async function connectDB(uri = env.MONGO_URI) {
  await mongoose.connect(uri, { autoIndex: true, serverSelectionTimeoutMS: 10000 });
  logger.info({ db: mongoose.connection.name }, "MongoDB connected");
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
