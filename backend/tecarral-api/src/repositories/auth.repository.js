import pool from "../config/db.js";

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] ?? null;
}

export async function createUser(email, passwordHash, role, nombre, telefono) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, nombre, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_user, email, role, nombre, telefono`,
    [email, passwordHash, role, nombre, telefono ?? null]
  );

  return result.rows[0];
}
