const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrShort = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const inr = (n, { exact = false } = {}) =>
  n === 0 ? "Free" : (exact || n % 1 !== 0 ? inrFmt : inrShort).format(n ?? 0);
export const money = (n) => inrFmt.format(n ?? 0);
/** Indian short scale: 1.2K, 3.4L (lakh), 2.1Cr (crore). */
export const compact = (n = 0) => {
  const a = Math.abs(n);
  const f = (v, s) => `${Number(v.toFixed(1))}${s}`;
  if (a >= 1e7) return f(n / 1e7, "Cr");
  if (a >= 1e5) return f(n / 1e5, "L");
  if (a >= 1e3) return f(n / 1e3, "K");
  return String(Math.round(n));
};
export const num = (n) => new Intl.NumberFormat("en-IN").format(n ?? 0);

export const duration = (sec = 0) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} h ${m ? `${m} min` : ""}`.trim() : `${m} min`;
};
export const clock = (sec = 0) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${String(m).padStart(2, "0")}:${r}`;
};

export const date = (d, opts = { day: "2-digit", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-IN", opts) : "—";
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export function timeAgo(d) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  const units = [
    [60, "min"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let v = s / 60;
  for (const [step, label] of units) {
    if (v < step) return `${Math.floor(v)} ${label} ago`;
    v /= step;
  }
  return `${Math.floor(v)} y ago`;
}

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const effectivePrice = (c) =>
  c.discountPrice != null && c.discountPrice < c.price ? c.discountPrice : c.price;

export const pctOff = (c) =>
  c.discountPrice != null && c.price > 0 && c.discountPrice < c.price
    ? Math.round((1 - c.discountPrice / c.price) * 100)
    : 0;

export const glyph = (title = "") => {
  const map = [
    [/react native/i, "▢"],
    [/react/i, "</>"],
    [/node/i, "λ"],
    [/mern/i, "{ }"],
    [/mongo/i, "db"],
    [/typescript/i, "TS"],
    [/tailwind/i, "tw"],
    [/design|figma/i, "◎"],
    [/docker|devops|ci/i, "⛴"],
    [/machine|python|ml/i, "∑"],
    [/llm|ai/i, "AI"],
    [/system/i, "⇄"],
  ];
  return map.find(([rx]) => rx.test(title))?.[1] || title.slice(0, 2).toUpperCase();
};
