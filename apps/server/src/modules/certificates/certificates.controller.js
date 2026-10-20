import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { Certificate } from "../../models/index.js";
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

  const verifyUrl = `${env.CLIENT_URL}/verify/${cert.code}`;
  const qr = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 220, color: { dark: "#14201b" } });
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="vidya-certificate-${cert.code}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;
  const green = "#0f7a5c";
  doc.rect(0, 0, W, H).fill("#f6f7f5");
  doc.rect(28, 28, W - 56, H - 56).lineWidth(2).stroke(green);
  doc.rect(36, 36, W - 72, H - 72).lineWidth(0.5).stroke("#9fc9b8");

  doc.fillColor(green).font("Helvetica-Bold").fontSize(26).text("Vidya", 0, 70, { align: "center" });
  doc.fillColor("#5b6b63").font("Helvetica").fontSize(12)
    .text("CERTIFICATE OF COMPLETION", 0, 108, { align: "center", characterSpacing: 3 });
  doc.fontSize(13).text("This certifies that", 0, 160, { align: "center" });
  doc.fillColor(green).font("Helvetica-Bold").fontSize(40).text(cert.userName, 0, 185, { align: "center" });
  doc.fillColor("#5b6b63").font("Helvetica").fontSize(13).text("has successfully completed", 0, 245, { align: "center" });
  doc.fillColor("#14201b").font("Helvetica-Bold").fontSize(24)
    .text(cert.courseTitle, 80, 272, { align: "center", width: W - 160 });
  doc.fillColor("#5b6b63").font("Helvetica").fontSize(12)
    .text(`${cert.hours} hours of content`, 0, 330, { align: "center" });

  doc.fillColor("#14201b").font("Helvetica-Bold").fontSize(14).text(cert.instructorName || "Vidya", 90, H - 150);
  doc.moveTo(90, H - 128).lineTo(300, H - 128).lineWidth(0.8).stroke("#14201b");
  doc.fillColor("#5b6b63").font("Helvetica").fontSize(11).text("Instructor", 90, H - 120);

  doc.image(qr, W / 2 - 40, H - 170, { width: 80 });

  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.fillColor("#14201b").font("Courier-Bold").fontSize(13).text(cert.code, W - 330, H - 150, { width: 240, align: "right" });
  doc.fillColor("#5b6b63").font("Helvetica").fontSize(11)
    .text(`Issued ${issued}`, W - 330, H - 128, { width: 240, align: "right" })
    .text(`Verify at ${verifyUrl}`, W - 430, H - 112, { width: 340, align: "right" });
  doc.end();
}
