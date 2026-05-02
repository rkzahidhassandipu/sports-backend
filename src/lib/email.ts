// src/lib/email.ts
import nodemailer from "nodemailer";
import { logger } from "../config/logger";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const APP  = process.env.APP_NAME || "Gym App";
const FROM = process.env.SMTP_FROM || `noreply@gymapp.com`;
const CLIENT = process.env.CLIENT_URL || "https://sports-club-self.vercel.app";

const base = (body: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:0}
  .wrap{max-width:580px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .hdr{background:#0f172a;padding:28px 32px;display:flex;align-items:center;gap:12px}
  .hdr h1{color:#fff;margin:0;font-size:22px;letter-spacing:-.3px}
  .hdr span{font-size:28px}
  .body{padding:36px 32px}
  .body p{color:#334155;line-height:1.7;margin:0 0 14px}
  .btn{display:inline-block;background:#0f172a;color:#fff!important;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;font-size:15px;margin:16px 0}
  .badge{display:inline-block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}
  .table{width:100%;border-collapse:collapse;margin:16px 0}
  .table td{padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569}
  .table td:first-child{color:#94a3b8;width:40%}
  .ftr{padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0}
  .ftr p{color:#94a3b8;font-size:12px;margin:0}
</style></head>
<body><div class="wrap">
  <div class="hdr"><span>🏋️</span><h1>${APP}</h1></div>
  <div class="body">${body}</div>
  <div class="ftr"><p>© ${new Date().getFullYear()} ${APP}. All rights reserved.</p></div>
</div></body></html>`;

async function send(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email → ${to} [${info.messageId}]`);
  } catch (err) {
    logger.error(`Email failed → ${to}:`, err);
  }
}

export const emailService = {
  verifyEmail: (email: string, url: string, name: string) =>
    send(email, `Verify your ${APP} account`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thanks for joining! Verify your email to unlock your account.</p>
      <p style="text-align:center"><a class="btn" href="${url}">Verify Email Address</a></p>
      <p>Link expires in 24 hours. Didn't sign up? Ignore this email.</p>`)),

  welcome: (email: string, name: string) =>
    send(email, `Welcome to ${APP}, ${name}!`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account is verified and ready. Start exploring classes and booking sessions!</p>
      <p style="text-align:center"><a class="btn" href="${CLIENT}/dashboard">Go to Dashboard</a></p>`)),

  passwordReset: (email: string, url: string, name: string) =>
    send(email, `Reset your ${APP} password`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a password reset request for your account.</p>
      <p style="text-align:center"><a class="btn" href="${url}">Reset Password</a></p>
      <p>Link expires in 1 hour. If you didn't request this, ignore this email.</p>`)),

  bookingConfirmed: (email: string, name: string, details: { session: string; date: string; time: string; location?: string; amount: string }) =>
    send(email, `Booking Confirmed — ${details.session}`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p><span class="badge">✓ Booking Confirmed</span></p>
      <table class="table">
        <tr><td>Session</td><td><strong>${details.session}</strong></td></tr>
        <tr><td>Date</td><td>${details.date}</td></tr>
        <tr><td>Time</td><td>${details.time}</td></tr>
        ${details.location ? `<tr><td>Location</td><td>${details.location}</td></tr>` : ""}
        <tr><td>Amount Paid</td><td><strong>${details.amount}</strong></td></tr>
      </table>
      <p style="text-align:center"><a class="btn" href="${CLIENT}/bookings">View My Bookings</a></p>`)),

  paymentReceipt: (email: string, name: string, amount: string, txId: string) =>
    send(email, `Payment Receipt — ${APP}`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Payment of <strong>${amount}</strong> received successfully.</p>
      <p>Transaction ID: <code style="background:#f1f5f9;padding:3px 8px;border-radius:4px">${txId}</code></p>
      <p style="text-align:center"><a class="btn" href="${CLIENT}/payments">View Payment History</a></p>`)),

  sessionCancelled: (email: string, name: string, session: string) =>
    send(email, `Session Cancelled — ${session}`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>The session <strong>${session}</strong> has been cancelled. If you paid, a refund will be processed within 5–7 business days.</p>
      <p style="text-align:center"><a class="btn" href="${CLIENT}/sessions">Browse Other Sessions</a></p>`)),

  ticketUpdate: (email: string, name: string, ticketId: string, status: string) =>
    send(email, `Support Ticket #${ticketId} Updated`, base(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your support ticket <strong>#${ticketId}</strong> status is now: <strong>${status}</strong>.</p>
      <p style="text-align:center"><a class="btn" href="${CLIENT}/support/${ticketId}">View Ticket</a></p>`)),

  newsletterConfirm: (email: string, url: string) =>
    send(email, `Confirm Newsletter Subscription`, base(`
      <p>You're almost subscribed to the ${APP} newsletter!</p>
      <p style="text-align:center"><a class="btn" href="${url}">Confirm Subscription</a></p>`)),
};
