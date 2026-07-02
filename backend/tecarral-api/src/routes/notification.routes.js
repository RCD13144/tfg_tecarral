import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listNotifications,
  registerPushTokenController,
  unregisterPushTokenController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.post("/push-token", requireAuth, registerPushTokenController);
router.delete("/push-token", requireAuth, unregisterPushTokenController);
router.patch("/read-all", requireAuth, markAllNotificationsAsReadController);
router.patch("/:id/read", requireAuth, markNotificationAsReadController);

export default router;

