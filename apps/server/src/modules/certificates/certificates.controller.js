import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { Certificate, Setting } from "../../models/index.js";
import ApiError from "../../utils/ApiError.js";
import env from "../../config/env.js";

export async function mine(req, res) {
  const certs = await Certificate.find({ user: req.user._id })
    .sort({ issuedAt: -1 })
    .populate("course", "slug color thumbnail")
    .lean();
  res.json({ success: true, data: certs });
}

export async function verify(req, res) {
  const cert = await Certificate.findOne({ code: req.params.code.toUpperCase() })
    .populate("course", "slug title")
    .lean();
  if (!cert) throw ApiError.notFound("No certificate matches this ID. Check the spelling.");
  res.json({ success: true, data: cert });
}

export async function pdf(req, res) {
  const cert = await Certificate.findOne({ code: req.params.code.toUpperCase() }).lean();
  if (!cert) throw ApiError.notFound("Certificate not found");
  const { platformName } = await Setting.get();

  const verifyUrl = `${env.CLIENT_URL}/verify/${cert.code}`;
  const qr = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 220, color: { dark: "#2b2b2b", light: "#ffffff" } });
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="certificate-${cert.code}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;
  const gold = "#c9a227";
  const ink = "#1f2937";
  const grey = "#6b7280";
  const center = (text, y, font, size, color, opts = {}) =>
    doc.fillColor(color).font(font).fontSize(size).text(text, 60, y, { width: W - 120, align: "center", ...opts });

  doc.rect(0, 0, W, H).fill("#ffffff");
  doc.rect(22, 22, W - 44, H - 44).lineWidth(4).stroke("#4338f5");
  doc.rect(32, 32, W - 64, H - 64).lineWidth(1).stroke("#4338f5");

  center(platformName, 70, "Times-Bold", 24, ink);
  center("Certificate of Completion", 108, "Times-Bold", 40, ink);
  center("This is to certify that", 178, "Times-Italic", 14, grey);
  center(cert.userName, 202, "Times-BoldItalic", 42, "#1e1b4b");
  center("has successfully completed the course", 262, "Times-Roman", 14, grey);
  center(cert.courseTitle, 288, "Times-Bold", 24, ink);
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  center(`on ${issued} · ${cert.hours} hours of content`, 330, "Times-Roman", 12, grey);

  // signatures
  const sig = (x, name, role) => {
    doc.fillColor(ink).font("Times-Italic").fontSize(20).text(name, x - 110, H - 168, { width: 220, align: "center" });
    doc.moveTo(x - 90, H - 140).lineTo(x + 90, H - 140).lineWidth(0.8).stroke("#9ca3af");
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text(name, x - 110, H - 132, { width: 220, align: "center" });
    doc.fillColor(grey).font("Helvetica").fontSize(9).text(role, x - 110, H - 118, { width: 220, align: "center" });
  };
  sig(W * 0.25, cert.instructorName || platformName, "Instructor");
  sig(W * 0.75, platformName, "Platform");

  // gold seal
  const cx = W / 2;
  const cy = H - 140;
  doc.circle(cx, cy, 40).fill("#e8d48a");
  doc.circle(cx, cy, 34).fill(gold);
  doc.circle(cx, cy, 28).lineWidth(0.8).dash(2, { space: 2 }).stroke("#ffffff").undash();
  doc.fillColor("#ffffff").font("Times-Bold").fontSize(9).text(platformName.toUpperCase(), cx - 30, cy - 4, { width: 60, align: "center" });

  doc.image(qr, W - 120, H - 120, { width: 58 });
  doc.fillColor(grey).font("Helvetica").fontSize(8)
    .text(`ID ${cert.code}`, 60, H - 62, { width: W - 200, align: "left" })
    .text(`Verify at ${verifyUrl}`, 60, H - 50, { width: W - 200, align: "left" });
  doc.end();
}
