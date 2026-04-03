import nodemailer from "nodemailer";

function readEnv(name) {
  const v = process.env[name];
  return v === undefined ? "" : String(v).trim();
}

function readEnvBool(name, fallback) {
  const raw = readEnv(name);
  if (raw.length === 0) return fallback;
  const v = raw.toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function readEnvInt(name, fallback) {
  const raw = readEnv(name);
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function createMailer() {
  const host = readEnv("SMTP_HOST");
  const port = readEnvInt("SMTP_PORT", 465);
  const secure = readEnvBool("SMTP_SECURE", true);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error("Faltan variables SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = createMailer();

  const fromName = readEnv("MAIL_FROM_NAME") || "Tecarral";
  const fromEmail = readEnv("MAIL_FROM_EMAIL") || readEnv("SMTP_USER");
  const from = `${fromName} <${fromEmail}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  return info;
}
