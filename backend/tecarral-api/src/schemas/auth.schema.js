import { ROLES } from "../constants/roles.js";

export function validateRegisterBody(body) {
  const errors = [];

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const telefono = typeof body.telefono === "string" ? body.telefono.trim() : null;

  const roleRaw = typeof body.role === "string" ? body.role.trim() : null;
  const role =
    roleRaw === ROLES.ADMIN || roleRaw === ROLES.TECNICO ? roleRaw : null;

  if (!email) errors.push("email es obligatorio");
  if (email && !email.includes("@")) errors.push("email no es válido");

  if (!password) errors.push("password es obligatorio");
  if (password && password.length < 6) errors.push("password debe tener al menos 6 caracteres");

  if (!telefono) errors.push("telefono es obligatorio"); 
  if (telefono.length !== 9) errors.push("El telefono debe tener 9 caracteres"); 

  if (!nombre) errors.push("nombre es obligatorio");

  return {
    ok: errors.length === 0,
    errors,
    value: {
      email,
      password,
      nombre,
      telefono,
      role,
    },
  };
}

export function validateLoginBody(body) {
  const errors = [];

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) errors.push("email es obligatorio");
  if (email && !email.includes("@")) errors.push("email no es válido");

  if (!password) errors.push("password es obligatorio");

  return {
    ok: errors.length === 0,
    errors,
    value: { email, password },
  };
}
