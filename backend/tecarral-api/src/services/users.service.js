import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  createUser,
  deleteUser,
  findUserAuthById,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserPhone,
  updateUserPassword,
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
    is_active: user.is_active,
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

  const user = await createUser(email, passwordHash, role, nombre, telefono, true);

  return {
    user,
    temporaryPassword,
  };
}

export async function listUsersForAdmin() {
  return listUsers();
}

export async function updateAuthenticatedUser(idUser, telefono) {
  const existingUser = await findUserById(idUser);

  if (!existingUser || existingUser.is_active === false) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await updateUserPhone(idUser, telefono);
  return updatedUser;
}

export async function deactivateUserByAdmin(actorUserId, targetUserId) {
  if (Number(actorUserId) === Number(targetUserId)) {
    const error = new Error("No puedes darte de baja a ti mismo");
    error.statusCode = 409;
    throw error;
  }

  const existingUser = await findUserById(targetUserId);

  if (!existingUser) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  try {
    return await deleteUser(targetUserId);
  } catch (error) {
    if (error?.code === "23503") {
      const conflictError = new Error(
        "No se puede eliminar este usuario porque tiene informacion relacionada en el sistema"
      );
      conflictError.statusCode = 409;
      throw conflictError;
    }

    throw error;
  }
}

export async function changeAuthenticatedUserPassword(
  idUser,
  currentPassword,
  newPassword
) {
  const existingUser = await findUserAuthById(idUser);

  if (!existingUser || existingUser.is_active === false) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const passwordIsValid = await verifyPassword(currentPassword, existingUser.password_hash);

  if (!passwordIsValid) {
    const error = new Error("La contraseña actual no es correcta");
    error.statusCode = 401;
    throw error;
  }

  const newPasswordHash = await hashPassword(newPassword);
  return updateUserPassword(idUser, newPasswordHash, false);
}
