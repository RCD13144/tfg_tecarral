import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import { registerPushToken, unregisterPushToken } from "../services/pushNotification.service.js";

export async function listNotifications(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const unreadOnly = String(req.query?.unread_only ?? "").trim().toLowerCase() === "true";
    const limit = Number(req.query?.limit ?? 100);

    const result = await getNotificationsForUser(idUser, {
      unreadOnly,
      limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function markNotificationAsReadController(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const idNotification = Number(req.params.id);

    const result = await markNotificationRead(idNotification, idUser);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function markAllNotificationsAsReadController(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const result = await markAllNotificationsRead(idUser);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}
export async function registerPushTokenController(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const result = await registerPushToken({
      idUser,
      expoPushToken: req.body?.expo_push_token,
      platform: req.body?.platform ?? null,
      deviceId: req.body?.device_id ?? null,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}

export async function unregisterPushTokenController(req, res) {
  try {
    const idUser = Number(req.user?.id_user);
    const result = await unregisterPushToken({
      idUser,
      expoPushToken: req.body?.expo_push_token,
    });
    res.status(200).json(result ?? { removed: true });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ error: error.message ?? "Error" });
  }
}
