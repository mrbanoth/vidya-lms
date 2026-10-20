import { create } from "zustand";
import { persist } from "zustand/middleware";

const applyTheme = (theme) => {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
};

export const useUI = create(
  persist(
    (set) => ({
      theme: "system",
      guestCart: [],
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      addGuestCart: (id) => set((s) => ({ guestCart: s.guestCart.includes(id) ? s.guestCart : [...s.guestCart, id] })),
      removeGuestCart: (id) => set((s) => ({ guestCart: s.guestCart.filter((x) => x !== id) })),
      clearGuestCart: () => set({ guestCart: [] }),
    }),
    {
      name: "vidya-ui",
      onRehydrateStorage: () => (state) => state && applyTheme(state.theme),
    }
  )
);

if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useUI.getState().theme === "system") applyTheme("system");
  });
}
