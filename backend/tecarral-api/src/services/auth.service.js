import { createUser, findUserByEmail } from "../repositories/users.repository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export async function register(email, plainPassword, role, nombre, telefono) {
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

  const passwordHash = await hashPassword(plainPassword);

  const user = await createUser(email, passwordHash, role, nombre, telefono);

  return user;
}


export async function login(email, plainPassword) {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  const ok = await verifyPassword(plainPassword, user.password_hash);

  if (!ok) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({ id: user.id_user, role: user.role, email: user.email });

  return {
    token,
    user: { id: user.id_user, email: user.email, role: user.role }
  };
}
