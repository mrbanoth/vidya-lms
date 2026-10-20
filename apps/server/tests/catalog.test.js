import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { api, setupDb, login, auth } from "./helpers.js";

let data;
beforeAll(async () => (data = await setupDb()));
afterAll(() => mongoose.disconnect());

describe("catalog", () => {
  it("lists published courses with filters and pagination", async () => {
    const all = await api().get("/api/v1/courses?limit=5");
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(5);
    expect(all.body.meta.total).toBe(12);

    const free = await api().get("/api/v1/courses?price=free");
    expect(free.body.data.every((c) => c.price === 0)).toBe(true);

    const search = await api().get("/api/v1/courses?q=react");
    expect(search.body.data.length).toBeGreaterThan(0);

    const cat = await api().get("/api/v1/courses?category=web-development&level=Intermediate");
    expect(cat.body.data.every((c) => c.level === "Intermediate")).toBe(true);
  });

  it("hides private video URLs on the public course page", async () => {
    const res = await api().get(`/api/v1/courses/${data.courses[0].slug}`);
    expect(res.status).toBe(200);
    const lessons = res.body.data.sections.flatMap((s) => s.lessons);
    expect(lessons.filter((l) => !l.isPreview).every((l) => !l.videoUrl)).toBe(true);
    expect(lessons.some((l) => l.isPreview && l.videoUrl)).toBe(true);
  });

  it("does not expose draft courses publicly", async () => {
    const list = await api().get("/api/v1/courses?q=GraphQL");
    expect(list.body.data).toHaveLength(0);
  });

  it("returns home page data and categories", async () => {
    const home = await api().get("/api/v1/home");
    expect(home.body.data.bestsellers.length).toBeGreaterThan(0);
    expect((await api().get("/api/v1/categories")).body.data).toHaveLength(6);
  });

  it("manages wishlist and cart", async () => {
    const { token } = await login("rahul@example.com");
    const id = data.courses[9]._id;
    const w = await api().post(`/api/v1/users/me/wishlist/${id}`).set(auth(token));
    expect(w.body.data.some((c) => c._id === String(id))).toBe(true);
    const c = await api().post(`/api/v1/users/me/cart/${id}`).set(auth(token));
    expect(c.status).toBe(200);
    const rm = await api().delete(`/api/v1/users/me/cart/${id}`).set(auth(token));
    expect(rm.body.data).toHaveLength(0);
  });
});
