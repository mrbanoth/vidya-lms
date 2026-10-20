import nodemailer from "nodemailer";
import env from "../config/env.js";
import logger from "./logger.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

const layout = (title, body) => `<!doctype html><html><body style="margin:0;background:#f6f7f5;font-family:Arial,sans-serif;color:#14201b">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:520px;background:#fff;border:1px solid #dde3de;border-radius:12px" cellpadding="0" cellspacing="0">
<tr><td style="padding:24px 28px;border-bottom:1px solid #dde3de;font-size:20px;font-weight:800;color:#0f7a5c">Vidya</td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #dde3de;font-size:12px;color:#5b6b63">You get this email because you have a Vidya account.</td></tr>
</table></td></tr></table></body></html>`;

const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#0f7a5c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${label}</a></p>`;

export const templates = {
  verify: (name, code) => ({
    subject: `${code} is your Vidya verification code`,
    html: layout(
      `Hi ${name}, verify your email`,
      `<p>Enter this code to finish creating your account. It expires in 10 minutes.</p><p style="font-size:32px;letter-spacing:8px;font-weight:800;font-family:monospace">${code}</p>`
    ),
  }),
  reset: (name, link) => ({
    subject: "Reset your Vidya password",
    html: layout(
      `Hi ${name}, reset your password`,
      `<p>Someone asked to reset the password for your account. The link works for 30 minutes.</p>${button(link, "Reset password")}<p style="color:#5b6b63;font-size:13px">If this was not you, ignore this email. Your password stays the same.</p>`
    ),
  }),
  receipt: (name, order) => ({
    subject: `Receipt for order ${order.invoiceNo}`,
    html: layout(
      `Thanks for your purchase, ${name}`,
      `<p>Order <b>${order.invoiceNo}</b></p><ul>${order.items.map((i) => `<li>${i.title} — ₹${i.price}</li>`).join("")}</ul><p>Total paid: <b>₹${order.total}</b> (incl. GST)</p>${button(`${env.CLIENT_URL}/my-learning`, "Start learning")}`
    ),
  }),
  courseDecision: (name, title, approved, reason) => ({
    subject: approved ? `"${title}" is live on Vidya` : `Changes requested for "${title}"`,
    html: layout(
      approved ? "Your course is published" : "Your course needs changes",
      approved
        ? `<p>Hi ${name}, <b>${title}</b> passed review and is now in the catalog.</p>`
        : `<p>Hi ${name}, reviewers asked for changes to <b>${title}</b>:</p><blockquote style="border-left:3px solid #c2424f;padding-left:12px;color:#5b6b63">${reason || "See the studio for details."}</blockquote>`
    ),
  }),
  contact: (data) => ({
    subject: `[Contact] ${data.topic} from ${data.name}`,
    html: layout("New contact message", `<p><b>${data.name}</b> &lt;${data.email}&gt;</p><p>${data.message}</p>`),
  }),
};

export async function sendEmail(to, { subject, html }) {
  if (env.isTest) return;
  if (!transporter) {
    logger.info({ to, subject }, "Email (console transport)");
    if (!env.isProd) {
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      console.log(`\n--- email to ${to} ---\n${subject}\n${text.slice(0, 400)}\n---\n`);
    }
    return;
  }
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    logger.error({ err, to, subject }, "Email failed");
  }
}
