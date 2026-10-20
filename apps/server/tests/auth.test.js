import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { api, setupDb, login, auth } from "./helpers.js";

beforeAll(setupDb);
afterAll(() => mongoose.disconnect());

describe("auth", () => {
  it("registers, verifies with OTP and returns a session", async () => {
    const reg = await api()
      .post("/api/v1/auth/register")
      .send({ name: "Test Learner", email: "new@example.com", password: "Secret123" });
    expect(reg.status).toBe(201);
    const code = reg.body.data.code;
    expect(code).toMatch(/^\d{6}$/);

    const bad = await api().post("/api/v1/auth/verify-email").send({ email: "new@example.com", code: "000000" });
    expect(bad.status).toBe(400);

    const ok = await api().post("/api/v1/auth/verify-email").send({ email: "new@example.com", code });
    expect(ok.status).toBe(200);
    expect(ok.body.data.accessToken).toBeTruthy();
    expect(ok.headers["set-cookie"][0]).toMatch(/vidya_rt=.*HttpOnly/);
  });

  it("rejects weak passwords and duplicate emails", async () => {
    const weak = await api().post("/api/v1/auth/register").send({ name: "A B", email: "x@example.com", password: "short" });
    expect(weak.status).toBe(400);
    expect(weak.body.errors.password).toBeTruthy();
    const dup = await api()
      .post("/api/v1/auth/register")
      .send({ name: "Dup", email: "student@vidya.dev", password: "Secret123" });
    expect(dup.status).toBe(409);
  });

  it("blocks unverified login and wrong passwords", async () => {
    await api().post("/api/v1/auth/register").send({ name: "Pending", email: "pending@example.com", password: "Secret123" });
    const res = await api().post("/api/v1/auth/login").send({ email: "pending@example.com", password: "Secret123" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
    const wrong = await api().post("/api/v1/auth/login").send({ email: "student@vidya.dev", password: "Nope12345" });
    expect(wrong.status).toBe(401);
  });

  it("rotates refresh tokens and revokes the family on reuse", async () => {
    const { cookie } = await login("student@vidya.dev");
    const first = await api().post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(first.status).toBe(200);
    const rotated = first.headers["set-cookie"];
    const reuse = await api().post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(reuse.status).toBe(401);
    const afterReuse = await api().post("/api/v1/auth/refresh").set("Cookie", rotated);
    expect(afterReuse.status).toBe(401);
  });

  it("resets a password with an emailed token", async () => {
    const f = await api().post("/api/v1/auth/forgot-password").send({ email: "kavya@example.com" });
    const token = f.body.data.token;
    const r = await api().post("/api/v1/auth/reset-password").send({ token, password: "NewPass123" });
    expect(r.status).toBe(200);
    await expect(login("kavya@example.com", "NewPass123")).resolves.toBeTruthy();
  });

  it("protects routes by role", async () => {
    const { token } = await login("student@vidya.dev");
    expect((await api().get("/api/v1/admin/overview").set(auth(token))).status).toBe(403);
    expect((await api().get("/api/v1/instructor/courses").set(auth(token))).status).toBe(403);
    expect((await api().get("/api/v1/auth/me")).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set(auth(token))).status).toBe(200);
  });

  it("strips NoSQL operators from input", async () => {
    const res = await api().post("/api/v1/auth/login").send({ email: { $gt: "" }, password: { $gt: "" } });
    expect(res.status).toBe(400);
  });
});
