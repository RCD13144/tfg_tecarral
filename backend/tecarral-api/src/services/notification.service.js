import pool from "../config/db.js";
import { listActiveUsers } from "../repositories/users.repository.js";
import {
  createNotificationTx,
  listNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../repositories/notification.repository.js";
import { sendMail } from "../utils/mailer.js";
import { dispatchPushNotificationsForNotifications } from "./pushNotification.service.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function broadcastNotification({
  tipo,
  title,
  message,
  entity_type = null,
  entity_id = null,
  payload = {},
  dedupeKeyBase = null,
}) {
  const users = await listActiveUsers();

  if (users.length === 0) {
    return [];
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const created = [];

    for (const user of users) {
      const item = await createNotificationTx(client, {
        id_user: user.id_user,
        tipo,
        title,
        message,
        entity_type,
        entity_id,
        dedupe_key: dedupeKeyBase ? `${dedupeKeyBase}:${user.id_user}` : null,
        payload,
      });

      if (item) {
        created.push({ notification: item, user });
      }
    }

    await client.query("COMMIT");

    for (const entry of created) {
      if (!entry.user.email) {
        continue;
      }

      try {
        await sendMail({
          to: entry.user.email,
          subject: `[Tecarral] ${title}`,
          text: `${message}\n\nReferencia: ${entity_type ?? "evento"} ${entity_id ?? ""}`.trim(),
          html: `<p>${message}</p>`,
        });
      } catch {
        // La bandeja interna ya actúa como canal principal persistente.
      }
    }

    try {
      await dispatchPushNotificationsForNotifications(created);
    } catch {
      // El push es un canal adicional: nunca debe romper la notificación interna.
    }

    return created.map((entry) => entry.notification);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getNotificationsForUser(idUser, { unreadOnly = false, limit = 100 } = {}) {
  if (!Number.isInteger(idUser) || idUser <= 0) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  return listNotificationsByUser(idUser, { unreadOnly, limit });
}

export async function markNotificationRead(idNotification, idUser) {
  if (!Number.isInteger(idNotification) || idNotification <= 0) {
    throw createHttpError(400, "Id de notificación inválido");
  }

  const updated = await markNotificationAsRead(idNotification, idUser);

  if (!updated) {
    throw createHttpError(404, "Notificación no encontrada");
  }

  return updated;
}

export async function markAllNotificationsRead(idUser) {
  if (!Number.isInteger(idUser) || idUser <= 0) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  return {
    updated_count: await markAllNotificationsAsRead(idUser),
  };
}


