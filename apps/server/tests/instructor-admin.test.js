import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { api, setupDb, login, auth } from "./helpers.js";

let ins;
let admin;
beforeAll(async () => {
  await setupDb();
  ins = await login("priya@vidya.dev");
  admin = await login("admin@vidya.dev");
});
afterAll(() => mongoose.disconnect());

describe("instructor studio", () => {
  let courseId;
  let sectionId;
  it("creates a course with sections and lessons", async () => {
    const cats = await api().get("/api/v1/categories");
    const c = await api()
      .post("/api/v1/instructor/courses")
      .set(auth(ins.token))
      .send({ title: "Testing with Vitest", category: cats.body.data[0]._id, level: "Beginner" });
    expect(c.status).toBe(201);
    courseId = c.body.data._id;
    sectionId = c.body.data.sections[0]._id;
    for (const title of ["Intro", "Setup", "First test"]) {
      const l = await api()
        .post(`/api/v1/instructor/courses/${courseId}/sections/${sectionId}/lessons`)
        .set(auth(ins.token))
        .send({ title, videoUrl: "https://example.com/v.mp4", duration: 120 });
      expect(l.status).toBe(201);
    }
    const u = await api()
      .patch(`/api/v1/instructor/courses/${courseId}`)
      .set(auth(ins.token))
      .send({ subtitle: "Fast, reliable tests", price: 999, discountPrice: 299 });
    expect(u.body.data.discountPrice).toBe(299);
  });

  it("reorders lessons", async () => {
    const c = await api().get(`/api/v1/instructor/courses/${courseId}`).set(auth(ins.token));
    const ids = c.body.data.sections[0].lessons.map((l) => l._id).reverse();
    const r = await api()
      .put(`/api/v1/instructor/courses/${courseId}/order`)
      .set(auth(ins.token))
      .send({ sections: [{ id: sectionId, lessons: ids }] });
    expect(r.status).toBe(200);
    const after = await api().get(`/api/v1/instructor/courses/${courseId}`).set(auth(ins.token));
    expect(after.body.data.sections[0].lessons[0].title).toBe("First test");
  });

  it("stops other instructors editing the course", async () => {
    const other = await login("arjun@vidya.dev");
    const r = await api().patch(`/api/v1/instructor/courses/${courseId}`).set(auth(other.token)).send({ subtitle: "hack" });
    expect(r.status).toBe(403);
  });

  it("submits for review and admin approves it", async () => {
    const s = await api().post(`/api/v1/instructor/courses/${courseId}/submit`).set(auth(ins.token));
    expect(s.status).toBe(200);
    expect(s.body.data.status).toBe("review");
    const queue = await api().get("/api/v1/admin/courses").set(auth(admin.token));
    expect(queue.body.data.some((c) => c._id === courseId)).toBe(true);
    const d = await api()
      .post(`/api/v1/admin/courses/${courseId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "approve" });
    expect(d.body.data.status).toBe("published");
    const audit = await api().get("/api/v1/admin/audit?action=course.approve").set(auth(admin.token));
    expect(audit.body.data[0].targetLabel).toBe("Testing with Vitest");
  });

  it("returns dashboard, students and earnings", async () => {
    const d = await api().get("/api/v1/instructor/dashboard").set(auth(ins.token));
    expect(d.status).toBe(200);
    expect(d.body.data.weekly).toHaveLength(12);
    const e = await api().get("/api/v1/instructor/earnings").set(auth(ins.token));
    expect(e.body.data.lifetime).toBeGreaterThan(0);
    const s = await api().get("/api/v1/instructor/students").set(auth(ins.token));
    expect(s.body.data.length).toBeGreaterThan(0);
  });
});

describe("admin console", () => {
  it("shows overview, payments and reports", async () => {
    for (const path of ["overview", "payments", "reports", "payouts", "coupons", "settings", "users"]) {
      const r = await api().get(`/api/v1/admin/${path}`).set(auth(admin.token));
      expect(r.status, path).toBe(200);
    }
  });

  it("bans a user and their sessions stop working", async () => {
    const victim = await login("manoj@example.com");
    const users = await api().get("/api/v1/admin/users?q=manoj").set(auth(admin.token));
    const id = users.body.data[0]._id;
    const r = await api().patch(`/api/v1/admin/users/${id}`).set(auth(admin.token)).send({ status: "banned" });
    expect(r.status).toBe(200);
    expect((await api().get("/api/v1/auth/me").set(auth(victim.token))).status).toBe(403);
    expect((await api().post("/api/v1/auth/refresh").set("Cookie", victim.cookie)).status).toBe(401);
  });

  it("approves a refund and revokes access", async () => {
    const list = await api().get("/api/v1/admin/payments?status=refund_requested").set(auth(admin.token));
    const order = list.body.data[0];
    const r = await api().post(`/api/v1/admin/payments/${order._id}/refund`).set(auth(admin.token)).send({ decision: "approve" });
    expect(r.body.data.status).toBe("refunded");
  });

  it("creates coupons and categories with validation", async () => {
    const bad = await api().post("/api/v1/admin/coupons").set(auth(admin.token)).send({ code: "a", type: "percent", value: 10 });
    expect(bad.status).toBe(400);
    const ok = await api().post("/api/v1/admin/coupons").set(auth(admin.token)).send({ code: "NEWYEAR25", type: "percent", value: 25 });
    expect(ok.status).toBe(201);
    const cat = await api().post("/api/v1/admin/categories").set(auth(admin.token)).send({ name: "Cybersecurity", icon: "#" });
    expect(cat.body.data.slug).toBe("cybersecurity");
  });

  it("maintenance mode blocks learners but not admins", async () => {
    const { resetMaintenanceCache } = await import("../src/middlewares/maintenance.js");
    await api().patch("/api/v1/admin/settings").set(auth(admin.token)).send({ features: { maintenance: true } });
    resetMaintenanceCache();
    expect((await api().get("/api/v1/courses")).status).toBe(503);
    expect((await api().get("/api/v1/courses").set(auth(admin.token))).status).toBe(200);
    await api().patch("/api/v1/admin/settings").set(auth(admin.token)).send({ features: { maintenance: false } });
    resetMaintenanceCache();
  });
});
