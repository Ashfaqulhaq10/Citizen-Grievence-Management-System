import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env as Record<string, string | undefined>;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_PORT) {
    console.log(`[EMAIL] Initializing SMTP: host=${SMTP_HOST}, port=${SMTP_PORT}, user=${SMTP_USER}`);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  } else {
    console.warn("[EMAIL] SMTP not configured. Set SMTP_HOST and SMTP_PORT.");
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string) {
  const tx = getTransporter();
  const from = SMTP_FROM || "no-reply@samasya-nivaran.local";
  const subject = "Your Samasya Nivaran OTP Code";
  const html = `<div style="font-family:Arial,sans-serif">
    <h2>Samasya Nivaran</h2>
    <p>Your One-Time Password is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
    <p>This code will expire in 10 minutes.</p>
  </div>`;

  if (tx) {
    try {
      console.log(`[EMAIL] Sending OTP to ${to}...`);
      const result = await tx.sendMail({ from, to, subject, html });
      console.log(`[EMAIL] Successfully sent OTP to ${to}`, result.messageId);
    } catch (err: any) {
      console.error(`[EMAIL] Failed to send OTP to ${to}:`, err.message);
      throw err;
    }
  } else {
    console.log("[DEV] OTP for", to, "=", code);
  }
}

export function isValidEmail(email: string) {
  // Basic but robust validation: local-part@domain.tld with sane chars and tld 2-24 letters
  const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i;
  return re.test(email.trim());
}
