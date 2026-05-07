import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  firmarAlbaran,
  getAlbaranById,
  getAlbaranes,
} from "../controllers/albaranes.controller.js";

const router = Router();

router.get("/", requireAuth, getAlbaranes);
router.get("/:id", requireAuth, getAlbaranById);
router.patch("/:id/firmar", requireAuth, firmarAlbaran);

export default router;
