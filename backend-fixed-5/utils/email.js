/**
 * utils/email.js
 * Nodemailer email notification utility.
 * All sends are fire-and-forget — never block the HTTP response.
 */

const nodemailer = require("nodemailer");
const logger = require("./logger");

let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const FROM = `"${process.env.FROM_NAME || "Samvardhan Bloom"}" <${process.env.SMTP_USER}>`;
const NOTIFY = process.env.NOTIFY_EMAIL;

// ── Send booking notification to admin ───────────────────────────────────────
const sendBookingNotification = async (booking) => {
  const t = getTransporter();
  if (!t || !NOTIFY) return;
  const svc = (booking.service || "other").replace(/_/g, " ");
  try {
    await t.sendMail({
      from: FROM, to: NOTIFY,
      subject: `📋 New Booking: ${booking.name} — ${svc}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <div style="background:#1a5c3a;color:#fff;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">New Consultation Booking</h2>
          </div>
          <div style="padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#666;padding:6px 0;width:130px">Name</td><td style="padding:6px 0;font-weight:600">${booking.name}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Age</td><td style="padding:6px 0">${booking.age} years</td></tr>
              <tr><td style="color:#666;padding:6px 0">Phone</td><td style="padding:6px 0"><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
              <tr><td style="color:#666;padding:6px 0">Email</td><td style="padding:6px 0">${booking.email || "Not provided"}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Service</td><td style="padding:6px 0;text-transform:capitalize">${svc}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Message</td><td style="padding:6px 0">${booking.message || "—"}</td></tr>
            </table>
            <div style="margin-top:16px;padding:10px;background:#e6f4ec;border-radius:6px;font-size:13px;color:#1a5c3a">
              Submitted: ${new Date(booking.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </div>
          </div>
        </div>`
    });
  } catch (e) { logger.error("Booking notification email failed:", e.message); }
};

// ── Confirm booking to parent ─────────────────────────────────────────────────
const sendBookingConfirmation = async (booking) => {
  const t = getTransporter();
  if (!t || !booking.email) return;
  const svc = (booking.service || "other").replace(/_/g, " ");
  try {
    await t.sendMail({
      from: FROM, to: booking.email,
      subject: "Your consultation request is received 🌿",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <div style="background:#1a5c3a;color:#fff;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Thank you, ${booking.name.split(" ")[0]}!</h2>
          </div>
          <div style="padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
            <p>We have received your request for <strong>${svc}</strong>. Our team will contact you within <strong>24 hours</strong>.</p>
            <p>For immediate assistance: <a href="tel:${process.env.CENTRE_PHONE || "+919587246814"}">${process.env.CENTRE_PHONE || "+91 95872 46814"}</a></p>
            <p style="color:#888;font-size:13px;margin-top:20px">Samvardhan Bloom Rehabilitation Centre<br/>Pillar No 15, B/60, Maurya Path, near Bailey Road, Khajpura, Patna 800014</p>
          </div>
        </div>`
    });
  } catch (e) { logger.error("Booking confirmation email failed:", e.message); }
};

// ── Payment receipt to parent ─────────────────────────────────────────────────
const sendPaymentReceipt = async ({ name, email, amount, method, transactionId, service }) => {
  const t = getTransporter();
  if (!t || !email) return;
  try {
    await t.sendMail({
      from: FROM, to: email,
      subject: `✅ Payment Confirmed — ₹${amount?.toLocaleString("en-IN")}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <div style="background:#1a5c3a;color:#fff;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0">Payment Received</h2>
          </div>
          <div style="padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
            <p>Dear <strong>${name}</strong>, your payment has been received successfully.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="color:#666;padding:6px 0;width:160px">Amount</td><td style="font-weight:700;font-size:1.2em;color:#1a5c3a">₹${amount?.toLocaleString("en-IN")}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Payment Method</td><td style="text-transform:capitalize">${method || "—"}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Transaction ID</td><td>${transactionId || "—"}</td></tr>
              <tr><td style="color:#666;padding:6px 0">Service</td><td style="text-transform:capitalize">${(service || "").replace(/_/g, " ")}</td></tr>
            </table>
            <p style="color:#888;font-size:13px">Please keep this email as your payment receipt.</p>
            <p style="color:#888;font-size:13px">Samvardhan Bloom Rehabilitation Centre · ${process.env.CENTRE_PHONE || "+91 95872 46814"}</p>
          </div>
        </div>`
    });
  } catch (e) { logger.error("Payment receipt email failed:", e.message); }
};

module.exports = { sendBookingNotification, sendBookingConfirmation, sendPaymentReceipt };
