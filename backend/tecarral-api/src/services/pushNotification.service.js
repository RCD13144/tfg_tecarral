import {
  createPushDelivery,
  deactivateUserPushToken,
  listActivePushTokensByUserIds,
  markPushTokenSendResult,
  updatePushDelivery,
  upsertUserPushToken,
} from "../repositories/pushToken.repository.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isExpoPushToken(value) {
  const token = String(value ?? "").trim();
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

export async function registerPushToken({ idUser, expoPushToken, platform = null, deviceId = null }) {
  if (!Number.isInteger(idUser) || idUser <= 0) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!isExpoPushToken(expoPushToken)) {
    throw createHttpError(400, "Token Expo inválido");
  }

  return upsertUserPushToken({ idUser, expoPushToken: String(expoPushToken).trim(), platform, deviceId });
}

export async function unregisterPushToken({ idUser, expoPushToken }) {
  if (!Number.isInteger(idUser) || idUser <= 0) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!isExpoPushToken(expoPushToken)) {
    throw createHttpError(400, "Token Expo inválido");
  }

  return deactivateUserPushToken({ idUser, expoPushToken: String(expoPushToken).trim() });
}

async function sendExpoPushMessage(message) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = json?.errors?.[0]?.message ?? response.statusText;
    throw new Error(detail || "Expo rechazó el envío push");
  }

  return json?.data ?? null;
}

export async function dispatchPushNotificationsForNotifications(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const userIds = Array.from(new Set(entries.map((entry) => Number(entry.user?.id_user)).filter((id) => Number.isInteger(id) && id > 0)));
  const tokens = await listActivePushTokensByUserIds(userIds);
  const tokensByUser = new Map();

  for (const token of tokens) {
    const group = tokensByUser.get(Number(token.id_user)) ?? [];
    group.push(token);
    tokensByUser.set(Number(token.id_user), group);
  }

  const results = [];

  for (const entry of entries) {
    const notification = entry.notification;
    const userTokens = tokensByUser.get(Number(entry.user?.id_user)) ?? [];

    for (const token of userTokens) {
      const delivery = await createPushDelivery({
        notificationId: notification.id,
        userPushTokenId: token.id,
      });

      try {
        const ticket = await sendExpoPushMessage({
          to: token.expo_push_token,
          title: notification.title,
          body: notification.message,
          sound: "default",
          channelId: "maintenance-reminders",
          priority: "high",
          autoDismiss: false,
          sticky: false,
          data: {
            notification_id: notification.id,
            tipo: notification.tipo,
            entity_type: notification.entity_type,
            entity_id: notification.entity_id,
            payload: notification.payload ?? {},
          },
        });

        if (ticket?.status === "error") {
          const error = ticket?.details?.error ?? ticket?.message ?? "Error enviando push";
          await updatePushDelivery({ id: delivery.id, status: "ERROR", error });
          await markPushTokenSendResult({ id: token.id, ok: false, error });
          results.push({ token_id: token.id, status: "ERROR", error });
        } else {
          await updatePushDelivery({ id: delivery.id, status: "SENT", expoTicketId: ticket?.id ?? null });
          await markPushTokenSendResult({ id: token.id, ok: true, error: null });
          results.push({ token_id: token.id, status: "SENT" });
        }
      } catch (error) {
        const message = error?.message ?? "Error enviando push";
        await updatePushDelivery({ id: delivery.id, status: "ERROR", error: message });
        await markPushTokenSendResult({ id: token.id, ok: false, error: message });
        results.push({ token_id: token.id, status: "ERROR", error: message });
      }
    }
  }

  return results;
}



