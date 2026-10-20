import crypto from "node:crypto";

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");
export const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
export const otp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");
