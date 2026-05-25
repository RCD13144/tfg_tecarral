import { isSimpleEmailValid, toTrimmedText } from "./validation.schema.js";

export function validateLoginBody(body) {
  const errors = [];

  const email = toTrimmedText(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    errors.push("email es obligatorio");
  }

  if (email && !isSimpleEmailValid(email)) {
    errors.push("email no es valido");
  }

  if (!password) {
    errors.push("password es obligatorio");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: errors.length === 0 ? { email, password } : null,
  };
}

export function validateChangeTemporaryPasswordBody(body) {
  const errors = [];

  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!newPassword) {
    errors.push("newPassword es obligatorio");
  }

  if (newPassword && newPassword.length < 6) {
    errors.push("newPassword debe tener al menos 6 caracteres");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: errors.length === 0 ? { newPassword } : null,
  };
}
