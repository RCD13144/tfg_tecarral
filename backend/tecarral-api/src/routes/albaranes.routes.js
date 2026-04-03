import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { firmarAlbaran } from "../controllers/albaranes.controller.js";

const router = Router();

router.patch("/:id/firmar", requireAuth, firmarAlbaran);

export default router;