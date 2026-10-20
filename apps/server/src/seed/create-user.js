/**
 * Creates (or updates) one verified account in whatever database MONGODB_URI
 * points at. Safe for production: it touches only the given email.
 *
 *   npm run user:create -w apps/server -- --email teacher@yopmail.com --name "Vidya Teacher" --role instructor
 *
 * The password is read from the USER_PASSWORD env var or asked for
 * interactively, so it never lands in shell history or a chat.
 */
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import mongoose from "mongoose";
import { ROLE_LIST } from "@vidya/shared";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "student" } },
});
const email = values.email?.trim().toLowerCase();
if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Pass --email you@example.com");
if (!ROLE_LIST.includes(values.role)) throw new Error(`--role must be one of: ${ROLE_LIST.join(", ")}`);

let password = process.env.USER_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question(`Password for ${email}: `);
  rl.close();
}
if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password))
  throw new Error("Password needs 8+ characters with a letter and a number");

await connectDB();
let user = await User.findOne({ email }).select("+password");
const created = !user;
if (!user) user = new User({ email, name: values.name || email.split("@")[0] });
if (values.name) user.name = values.name;
user.role = values.role;
user.password = password;
user.isVerified = true;
user.status = "active";
await user.save();
console.log(`${created ? "Created" : "Updated"} ${user.role} ${user.email}`);
await mongoose.disconnect();
