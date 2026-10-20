import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { useEffect } from "react";
import ScrollToTop from "@/app/ScrollToTop";

function GoTo({ to }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return null;
}

describe("ScrollToTop", () => {
  it("survives browsers where scrollTo returns a Promise", async () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => Promise.resolve());
    const { unmount } = render(
      <MemoryRouter initialEntries={["/a"]}>
        <ScrollToTop />
        <Routes>
          <Route path="/a" element={<GoTo to="/b" />} />
          <Route path="/b" element={<p>b</p>} />
        </Routes>
      </MemoryRouter>
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(() => unmount()).not.toThrow();
    spy.mockRestore();
  });
});
