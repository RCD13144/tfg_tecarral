import { ROLES } from "../constants/roles.js";
import {
  isSimpleEmailValid,
  isSimplePhoneValid,
  toTrimmedText,
} from "./validation.schema.js";

export function validateCreateUserBody(body) {
  const errors = [];

  const email = toTrimmedText(body?.email);
  const nombre = toTrimmedText(body?.nombre);
  const telefono = toTrimmedText(body?.telefono);

  const roleRaw = toTrimmedText(body?.role);
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

  if (email && !isSimpleEmailValid(email)) {
    errors.push("email no es valido");
  }

  if (!telefono) {
    errors.push("telefono es obligatorio");
  }

  if (telefono && !isSimplePhoneValid(telefono)) {
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
  const telefono = toTrimmedText(body?.telefono);

  if (!telefono) {
    errors.push("telefono es obligatorio");
  }

  if (telefono && !isSimplePhoneValid(telefono)) {
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
