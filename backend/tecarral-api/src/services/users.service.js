import { findUserById } from "../repositories/users.repository.js";

export async function getMe(idUser) {
  const user = await findUserById(idUser);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
}
