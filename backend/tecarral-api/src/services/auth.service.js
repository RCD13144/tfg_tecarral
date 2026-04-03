import { findUserByEmail, updateUserPassword } from "../repositories/users.repository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export async function login(email, plainPassword) {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  const passwordIsValid = await verifyPassword(
    plainPassword,
    user.password_hash
  );

  if (!passwordIsValid) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  if (user.must_change_password) {
    return {
      must_change_password: true,
      user: {
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
        telefono: user.telefono,
      },
    };
  }

  const token = signToken({
    sub: String(user.id_user),
    role: user.role,
  });

  return {
    must_change_password: false,
    token,
    user: {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      telefono: user.telefono,
      must_change_password: user.must_change_password,
    },
  };
}

export async function changeTemporaryPassword(
  email,
  temporaryPassword,
  newPassword
) {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  if (!user.must_change_password) {
    const error = new Error("El usuario no requiere cambio de contraseña");
    error.statusCode = 400;
    throw error;
  }

  const temporaryPasswordIsValid = await verifyPassword(
    temporaryPassword,
    user.password_hash
  );

  if (!temporaryPasswordIsValid) {
    const error = new Error("Credenciales inválidas");
    error.statusCode = 401;
    throw error;
  }

  const newPasswordHash = await hashPassword(newPassword);

  const updatedUser = await updateUserPassword(
    user.id_user,
    newPasswordHash,
    false
  );

  const token = signToken({
    sub: String(updatedUser.id_user),
    role: updatedUser.role,
  });

  return {
    message: "Contraseña actualizada correctamente",
    token,
    user: {
      id_user: updatedUser.id_user,
      email: updatedUser.email,
      role: updatedUser.role,
      nombre: updatedUser.nombre,
      telefono: updatedUser.telefono,
      must_change_password: updatedUser.must_change_password,
    },
  };
}