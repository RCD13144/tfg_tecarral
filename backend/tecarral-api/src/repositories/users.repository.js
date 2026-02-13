import pool from "../config/db.js";

export async function findUserById(idUser) {
  const query = `
    SELECT id_user, email, role, nombre, telefono
    FROM public.users
    WHERE id_user = $1
  `;
  const result = await pool.query(query, [idUser]);
  return result.rows[0] ?? null;
}
