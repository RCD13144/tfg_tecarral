import pool from "../config/db.js";

export async function upsertUserPushToken({ idUser, expoPushToken, platform = null, deviceId = null }) {
  const result = await pool.query(
    `
    INSERT INTO public.user_push_token (
      id_user,
      expo_push_token,
      platform,
      device_id,
      is_active,
      last_error,
      updated_at
    )
    VALUES ($1, $2, $3, $4, TRUE, NULL, NOW())
    ON CONFLICT (expo_push_token)
    DO UPDATE SET
      id_user = EXCLUDED.id_user,
      platform = EXCLUDED.platform,
      device_id = EXCLUDED.device_id,
      is_active = TRUE,
      last_error = NULL,
      updated_at = NOW()
    RETURNING *
    `,
    [idUser, expoPushToken, platform, deviceId]
  );

  return result.rows[0] ?? null;
}

export async function deactivateUserPushToken({ idUser, expoPushToken }) {
  const result = await pool.query(
    `
    UPDATE public.user_push_token
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE id_user = $1
      AND expo_push_token = $2
    RETURNING *
    `,
    [idUser, expoPushToken]
  );

  return result.rows[0] ?? null;
}

export async function listActivePushTokensByUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const result = await pool.query(
    `
    SELECT *
    FROM public.user_push_token
    WHERE id_user = ANY($1::bigint[])
      AND is_active = TRUE
    ORDER BY id_user ASC, updated_at DESC
    `,
    [userIds]
  );

  return result.rows;
}

export async function createPushDelivery({ notificationId, userPushTokenId }) {
  const result = await pool.query(
    `
    INSERT INTO public.notification_push_delivery (
      notification_id,
      user_push_token_id,
      status
    )
    VALUES ($1, $2, 'PENDING')
    RETURNING *
    `,
    [notificationId ?? null, userPushTokenId]
  );

  return result.rows[0] ?? null;
}

export async function updatePushDelivery({ id, status, expoTicketId = null, error = null }) {
  const result = await pool.query(
    `
    UPDATE public.notification_push_delivery
    SET status = $2,
        expo_ticket_id = $3,
        error = $4,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id, status, expoTicketId, error]
  );

  return result.rows[0] ?? null;
}

export async function markPushTokenSendResult({ id, ok, error = null }) {
  await pool.query(
    `
    UPDATE public.user_push_token
    SET last_sent_at = CASE WHEN $2 THEN NOW() ELSE last_sent_at END,
        last_error = $3,
        is_active = CASE
          WHEN $2 THEN TRUE
          WHEN $3 ILIKE '%DeviceNotRegistered%' THEN FALSE
          ELSE is_active
        END,
        updated_at = NOW()
    WHERE id = $1
    `,
    [id, ok, error]
  );
}
