import pool from "../config/db.js";

export async function createNotificationTx(client, data) {
  const result = await client.query(
    `
    INSERT INTO public.notification (
      id_user,
      tipo,
      title,
      message,
      entity_type,
      entity_id,
      dedupe_key,
      payload
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    ON CONFLICT (id_user, dedupe_key)
    WHERE dedupe_key IS NOT NULL
    DO NOTHING
    RETURNING *;
    `,
    [
      data.id_user,
      data.tipo,
      data.title,
      data.message,
      data.entity_type ?? null,
      data.entity_id ?? null,
      data.dedupe_key ?? null,
      JSON.stringify(data.payload ?? {}),
    ]
  );

  return result.rows[0] ?? null;
}

export async function listNotificationsByUser(idUser, { unreadOnly = false, limit = 100 } = {}) {
  const values = [idUser, limit];
  const conditions = ["id_user = $1"];

  if (unreadOnly) {
    conditions.push("is_read = FALSE");
  }

  const result = await pool.query(
    `
    SELECT *
    FROM public.notification
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC, id DESC
    LIMIT $2
    `,
    values
  );

  return result.rows;
}

export async function markNotificationAsRead(idNotification, idUser) {
  const result = await pool.query(
    `
    UPDATE public.notification
    SET is_read = TRUE,
        read_at = NOW()
    WHERE id = $1
      AND id_user = $2
    RETURNING *;
    `,
    [idNotification, idUser]
  );

  return result.rows[0] ?? null;
}

export async function markAllNotificationsAsRead(idUser) {
  const result = await pool.query(
    `
    UPDATE public.notification
    SET is_read = TRUE,
        read_at = NOW()
    WHERE id_user = $1
      AND is_read = FALSE
    RETURNING id
    `,
    [idUser]
  );

  return result.rowCount ?? 0;
}
