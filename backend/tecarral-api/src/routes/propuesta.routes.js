import { Router } from "express";
import {getPropuestas, crearPropuesta, editarPropuesta, deletePropuesta, expirePropuestas} from "../controllers/propuesta.controller.js"
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/roles.middleware.js";

const router = Router();

router.get("/", requireAuth, getPropuestas);
router.post("/", requireAuth, requireRole("admin"), crearPropuesta);
router.patch("/:id", requireAuth, requireRole("admin"), editarPropuesta);
router.delete("/:id", requireAuth, requireRole("admin"), deletePropuesta);
router.post("/expire", requireAuth, requireRole("admin"), expirePropuestas);
export default router;
