import { ROLES } from "../constants/roles.js";

function normalizePhone(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCreateUserBody(body) {
  const errors = [];

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const telefono = normalizePhone(body?.telefono);

  const roleRaw = typeof body?.role === "string" ? body.role.trim() : "";
  const hasRole = roleRaw.length > 0;

  let role = ROLES.TECNICO;

  if (hasRole) {
    const isValidRole = roleRaw === ROLES.ADMIN || roleRaw === ROLES.TECNICO;

    if (!isValidRole) {
      errors.push("role no es valido");
    } else {
      role = roleRaw;
    }
  }

  if (!email) {
    errors.push("email es obligatorio");
  }

  if (email && !email.includes("@")) {
    errors.push("email no es valido");
  }

  if (!telefono) {
    errors.push("telefono es obligatorio");
  }

  if (telefono && telefono.length !== 9) {
    errors.push("El telefono debe tener 9 caracteres");
  }

  if (!nombre) {
    errors.push("nombre es obligatorio");
  }

  return {
    ok: errors.length === 0,
    errors,
    value:
      errors.length === 0
        ? {
            email,
            nombre,
            telefono,
            role,
          }
        : null,
  };
}

export function validateUpdateMeBody(body) {
  const errors = [];
  const telefono = normalizePhone(body?.telefono);

  if (!telefono) {
    errors.push("telefono es obligatorio");
  }

  if (telefono && telefono.length !== 9) {
    errors.push("El telefono debe tener 9 caracteres");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: errors.length === 0 ? { telefono } : null,
  };
}

export function validateChangeMyPasswordBody(body) {
  const errors = [];
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

  if (!currentPassword) {
    errors.push("currentPassword es obligatorio");
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
    value: errors.length === 0 ? { currentPassword, newPassword } : null,
  };
}
