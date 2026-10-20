import { describe, expect, it } from "vitest";
import { clock, compact, duration, effectivePrice, glyph, initials, inr, pctOff } from "@/lib/format";
import { priceLocally } from "@/features/cart/pricing";

describe("format helpers", () => {
  it("formats rupees and free courses", () => {
    expect(inr(0)).toBe("Free");
    expect(inr(499)).toBe("₹499");
    expect(inr(1234.5)).toBe("₹1,234.50");
  });
  it("uses the Indian short scale", () => {
    expect(compact(950)).toBe("950");
    expect(compact(12_400)).toBe("12.4K");
    expect(compact(3_40_000)).toBe("3.4L");
    expect(compact(2_10_00_000)).toBe("2.1Cr");
  });
  it("formats durations and clock times", () => {
    expect(duration(600)).toBe("10 min");
    expect(duration(3600 * 2 + 60 * 5)).toBe("2 h 5 min");
    expect(clock(65)).toBe("01:05");
    expect(clock(3725)).toBe("1:02:05");
  });
  it("picks sale prices and discounts", () => {
    expect(effectivePrice({ price: 3499, discountPrice: 499 })).toBe(499);
    expect(effectivePrice({ price: 999, discountPrice: null })).toBe(999);
    expect(pctOff({ price: 3499, discountPrice: 499 })).toBe(86);
  });
  it("builds initials and glyphs", () => {
    expect(initials("Sandeep Naik")).toBe("SN");
    expect(glyph("MERN Stack from Zero")).toBe("{ }");
  });
});

describe("local cart pricing", () => {
  it("adds 18% GST to the sale price", () => {
    const q = priceLocally([{ price: 3999, discountPrice: 699 }, { price: 0, discountPrice: null }]);
    expect(q.subtotal).toBe(699);
    expect(q.original).toBe(3999);
    expect(q.tax).toBe(125.82);
    expect(q.total).toBe(824.82);
  });
});
