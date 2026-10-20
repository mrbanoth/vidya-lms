import { GST_RATE } from "@vidya/shared";

export const round2 = (n) => Math.round(n * 100) / 100;

/** Effective price a learner pays for a course before coupons. */
export const effectivePrice = (course) =>
  course.discountPrice != null && course.discountPrice < course.price ? course.discountPrice : course.price;

export function priceCart(courses, coupon) {
  const subtotal = round2(courses.reduce((sum, c) => sum + effectivePrice(c), 0));
  const original = round2(courses.reduce((sum, c) => sum + c.price, 0));
  let discount = 0;
  if (coupon) {
    discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
    discount = round2(Math.min(discount, subtotal));
  }
  const taxable = subtotal - discount;
  const tax = round2(taxable * GST_RATE);
  return { original, subtotal, discount, tax, total: round2(taxable + tax) };
}
