import { hashPassword } from "../utils/password.js";
import {
  createUser,
  findUserByEmail,
} from "../repositories/users.repository.js";

function generateTemporaryPassword(length = 12) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*";
  const allChars = uppercase + lowercase + digits + symbols;

  const passwordChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  while (passwordChars.length < length) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    passwordChars.push(allChars[randomIndex]);
  }

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const current = passwordChars[i];
    passwordChars[i] = passwordChars[randomIndex];
    passwordChars[randomIndex] = current;
  }

  return passwordChars.join("");
}

export function getAuthenticatedUser(user) {
  if (!user) {
    const error = new Error("Usuario no autenticado");
    error.statusCode = 401;
    throw error;
  }

  return {
    id_user: user.id_user,
    email: user.email,
    role: user.role,
    nombre: user.nombre,
    telefono: user.telefono,
    must_change_password: user.must_change_password,
  };
}

export async function createUserByAdmin(email, role, nombre, telefono) {
  if (!nombre) {
    const error = new Error("El nombre es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    const error = new Error("El email ya existe");
    error.statusCode = 409;
    throw error;
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await createUser(
    email,
    passwordHash,
    role,
    nombre,
    telefono,
    true
  );

  return {
    user,
    temporaryPassword,
  };
}