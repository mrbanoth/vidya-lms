import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import { seed } from "../src/seed/index.js";

export const app = createApp();
export const api = () => request(app);

let seeded;
export async function setupDb() {
  if (mongoose.connection.readyState !== 1) await connectDB(process.env.MONGO_URI);
  seeded = await seed({ quiet: true });
  return seeded;
}

export async function login(email, password = "Password123") {
  const res = await api().post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.body.message}`);
  const cookie = res.headers["set-cookie"];
  return { token: res.body.data.accessToken, cookie, user: res.body.data.user };
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
