import pool from "../config/db.js";

export async function findUserById(idUser) {
  const query = `
    SELECT id_user, email, role, nombre, telefono, must_change_password, is_active
    FROM public.users
    WHERE id_user = $1
  `;

  const result = await pool.query(query, [idUser]);

  return result.rows[0] ?? null;
}

export async function findUserByEmail(email) {
  const query = `
    SELECT id_user, email, password_hash, role, nombre, telefono, must_change_password, is_active
    FROM public.users
    WHERE email = $1
  `;

  const result = await pool.query(query, [email]);

  return result.rows[0] ?? null;
}

export async function createUser(
  email,
  passwordHash,
  role,
  nombre,
  telefono,
  mustChangePassword = true
) {
  const query = `
    INSERT INTO public.users (
      email,
      password_hash,
      role,
      nombre,
      telefono,
      must_change_password,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_user, email, role, nombre, telefono, must_change_password, is_active
  `;

  const result = await pool.query(query, [
    email,
    passwordHash,
    role,
    nombre,
    telefono ?? null,
    mustChangePassword,
    true,
  ]);

  return result.rows[0];
}

export async function updateUserPassword(
  idUser,
  passwordHash,
  mustChangePassword
) {
  const query = `
    UPDATE public.users
    SET password_hash = $2,
        must_change_password = $3
    WHERE id_user = $1
    RETURNING id_user, email, role, nombre, telefono, must_change_password, is_active
  `;

  const result = await pool.query(query, [
    idUser,
    passwordHash,
    mustChangePassword,
  ]);

  return result.rows[0] ?? null;
}

export async function findUserAuthById(idUser) {
  const query = `
    SELECT id_user, email, password_hash, role, nombre, telefono, must_change_password, is_active
    FROM public.users
    WHERE id_user = $1
  `;

  const result = await pool.query(query, [idUser]);

  return result.rows[0] ?? null;
}

export async function listUsers() {
  const query = `
    SELECT id_user, email, role, nombre, telefono, must_change_password, is_active
    FROM public.users
    ORDER BY LOWER(nombre), LOWER(email), id_user
  `;

  const result = await pool.query(query);
  return result.rows;
}

export async function updateUserPhone(idUser, telefono) {
  const query = `
    UPDATE public.users
    SET telefono = $2
    WHERE id_user = $1
    RETURNING id_user, email, role, nombre, telefono, must_change_password, is_active
  `;

  const result = await pool.query(query, [idUser, telefono]);
  return result.rows[0] ?? null;
}

export async function deleteUser(idUser) {
  const query = `
    DELETE FROM public.users
    WHERE id_user = $1
    RETURNING id_user, email, role, nombre, telefono, must_change_password, is_active
  `;

  const result = await pool.query(query, [idUser]);
  return result.rows[0] ?? null;
}
