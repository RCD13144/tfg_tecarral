import { ROLES } from "../constants/roles.js";

export function validateCreateUserBody(body) {
  const errors = [];

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const telefono = typeof body?.telefono === "string" ? body.telefono.trim() : "";

  const roleRaw = typeof body?.role === "string" ? body.role.trim() : "";
  const hasRole = roleRaw.length > 0;

  let role = ROLES.TECNICO;

  if (hasRole) {
    const isValidRole = roleRaw === ROLES.ADMIN || roleRaw === ROLES.TECNICO;

    if (!isValidRole) {
      errors.push("role no es válido");
    } else {
      role = roleRaw;
    }
  }

  if (!email) {
    errors.push("email es obligatorio");
  }

  if (email && !email.includes("@")) {
    errors.push("email no es válido");
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