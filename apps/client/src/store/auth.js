import { create } from "zustand";

/** Access token lives in memory only; the refresh token is an httpOnly cookie. */
export const useAuth = create((set) => ({
  user: null,
  accessToken: null,
  ready: false,
  setSession: ({ user, accessToken }) => set({ user, accessToken, ready: true }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, ready: true }),
  markReady: () => set({ ready: true }),
}));

export const homeFor = (role) =>
  role === "admin" ? "/admin" : role === "instructor" ? "/studio" : "/dashboard";
