import { GST_RATE } from "@vidya/shared";
import { effectivePrice } from "@/lib/format";

const r2 = (n) => Math.round(n * 100) / 100;

export function priceLocally(items) {
  const subtotal = r2(items.reduce((t, c) => t + effectivePrice(c), 0));
  const original = r2(items.reduce((t, c) => t + c.price, 0));
  const tax = r2(subtotal * GST_RATE);
  return { original, subtotal, discount: 0, tax, total: r2(subtotal + tax) };
}
