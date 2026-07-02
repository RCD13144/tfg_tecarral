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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: { servername: host },
    auth: { user, pass },
  });
}

function normalizeMailError(error) {
  const code = String(error?.code ?? "").trim().toUpperCase();
  const responseCode = Number(error?.responseCode);
  const responseText = String(error?.response ?? error?.message ?? "").trim();

  if (code === "EAUTH" || responseCode === 535) {
    return new Error(
      "Autenticación SMTP rechazada. Revisa SMTP_USER y SMTP_PASS; si usas Gmail, usa una contraseña de aplicación."
    );
  }

  if (code === "ECONNECTION" || code === "ESOCKET" || code === "ETIMEDOUT") {
    return new Error(
      "No se pudo conectar con el servidor SMTP. Revisa SMTP_HOST/SMTP_PORT/SMTP_SECURE y que Oracle permita la salida."
    );
  }

  if (responseCode === 553 || responseCode === 554) {
    return new Error(`El servidor SMTP rechazó el envío: ${responseText || "destinatario o remitente inválido"}`);
  }

  return new Error(responseText || "Error enviando email");
}

export async function sendMail({ to, subject, html, text, attachments = [] }) {
  const transporter = createMailer();

  const fromName = readEnv("MAIL_FROM_NAME") || "Tecarral";
  const fromEmail = readEnv("MAIL_FROM_EMAIL") || readEnv("SMTP_USER");
  const from = `${fromName} <${fromEmail}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });

    return info;
  } catch (error) {
    throw normalizeMailError(error);
  }
}
