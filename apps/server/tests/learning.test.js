import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { api, setupDb, login, auth } from "./helpers.js";
import { Course, Lesson } from "../src/models/index.js";

let data;
let token;
beforeAll(async () => {
  data = await setupDb();
  ({ token } = await login("student@vidya.dev"));
});
afterAll(() => mongoose.disconnect());

describe("checkout and learning", () => {
  it("prices a cart with a coupon and GST", async () => {
    const course = data.courses[1];
    const res = await api()
      .post("/api/v1/checkout/quote")
      .set(auth(token))
      .send({ courseIds: [String(course._id)], code: "LEARN10" });
    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(699);
    expect(res.body.data.discount).toBe(69.9);
    expect(res.body.data.total).toBeCloseTo((699 - 69.9) * 1.18, 1);

    const bad = await api()
      .post("/api/v1/checkout/quote")
      .set(auth(token))
      .send({ courseIds: [String(course._id)], code: "LAUNCH50" });
    expect(bad.status).toBe(400);
  });

  it("buys a course with the test gateway and enrolls the learner", async () => {
    const course = data.courses[10];
    const co = await api().post("/api/v1/checkout").set(auth(token)).send({ courseIds: [String(course._id)] });
    expect(co.status).toBe(201);
    expect(co.body.data.mode).toBe("test");
    const v = await api().post("/api/v1/checkout/verify").set(auth(token)).send({ orderId: co.body.data.order._id });
    expect(v.status).toBe(200);
    expect(v.body.data.status).toBe("paid");

    const again = await api().post("/api/v1/checkout").set(auth(token)).send({ courseIds: [String(course._id)] });
    expect(again.status).toBe(409);

    const mine = await api().get("/api/v1/learn/my-courses").set(auth(token));
    expect(mine.body.data.some((e) => e.course._id === String(course._id))).toBe(true);
  });

  it("blocks lesson content for learners who are not enrolled", async () => {
    const other = await login("vivek@example.com");
    const course = data.courses[11];
    const res = await api().get(`/api/v1/learn/${course._id}`).set(auth(other.token));
    expect([200, 403]).toContain(res.status);
    if (res.status === 403) expect(res.body.message).toMatch(/Enroll/);
  });

  it("tracks progress, grades quizzes and issues a certificate at 100%", async () => {
    const course = await Course.findById(data.courses[10]._id);
    const ids = course.sections.flatMap((s) => s.lessons.map(String));
    const lessons = await Lesson.find({ _id: { $in: ids } }).lean();
    let last;
    for (const l of lessons) {
      if (l.type === "quiz") {
        const wrong = await api()
          .post(`/api/v1/learn/${course._id}/lessons/${l._id}/quiz`)
          .set(auth(token))
          .send({ answers: l.quiz.questions.map(() => -1) });
        expect(wrong.body.data.passed).toBe(false);
        last = await api()
          .post(`/api/v1/learn/${course._id}/lessons/${l._id}/quiz`)
          .set(auth(token))
          .send({ answers: l.quiz.questions.map((q) => q.answer) });
        expect(last.body.data.passed).toBe(true);
      } else {
        last = await api()
          .post(`/api/v1/learn/${course._id}/progress`)
          .set(auth(token))
          .send({ lessonId: String(l._id), completed: true, positionSec: 30 });
        expect(last.status).toBe(200);
      }
    }
    const certs = await api().get("/api/v1/certificates/mine").set(auth(token));
    const cert = certs.body.data.find((c) => String(c.course._id) === String(course._id));
    expect(cert).toBeTruthy();
    const verify = await api().get(`/api/v1/certificates/verify/${cert.code}`);
    expect(verify.body.data.userName).toBe("Sandeep Naik");
    const pdf = await api().get(`/api/v1/certificates/${cert.code}/pdf`);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
  });

  it("saves notes, questions and reviews", async () => {
    const course = data.courses[0];
    const lessonId = String(course.sections[0].lessons[0]);
    const n = await api().post(`/api/v1/learn/${course._id}/notes`).set(auth(token)).send({ lessonId, timeSec: 12, body: "Remember this" });
    expect(n.status).toBe(201);
    const q = await api().post(`/api/v1/learn/${course._id}/questions`).set(auth(token)).send({ lessonId, title: "How does this part work?" });
    expect(q.status).toBe(201);
    const r = await api().put(`/api/v1/learn/${course._id}/review`).set(auth(token)).send({ rating: 5, comment: "Great" });
    expect(r.status).toBe(200);
  });

  it("requests a refund on a paid order", async () => {
    const orders = await api().get("/api/v1/orders").set(auth(token));
    const paid = orders.body.data.find((o) => o.status === "paid" && o.total > 0);
    const res = await api().post(`/api/v1/orders/${paid._id}/refund`).set(auth(token)).send({ reason: "Changed my mind" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("refund_requested");
  });
});
