export function validateLoginBody(body) {
  const errors = [];

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    errors.push("email es obligatorio");
  }

  if (email && !email.includes("@")) {
    errors.push("email no es válido");
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

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const temporaryPassword =
    typeof body?.temporaryPassword === "string" ? body.temporaryPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!email) {
    errors.push("email es obligatorio");
  }

  if (email && !email.includes("@")) {
    errors.push("email no es válido");
  }

  if (!temporaryPassword) {
    errors.push("temporaryPassword es obligatorio");
  }

  if (!newPassword) {
    errors.push("newPassword es obligatorio");
  }

  if (newPassword && newPassword.length < 6) {
    errors.push("newPassword debe tener al menos 6 caracteres");
  }

  return {
    ok: errors.length === 0,
    errors,
    value:
      errors.length === 0
        ? {
            email,
            temporaryPassword,
            newPassword,
          }
        : null,
  };
}