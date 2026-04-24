import { Router } from "express";
import {getPropuestas, crearPropuesta, editarPropuesta, deletePropuesta, expirePropuestas} from "../controllers/propuesta.controller.js"
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/roles.middleware.js";

const router = Router();

router.get("/", requireAuth, getPropuestas);
router.post("/", requireAuth, requireRole("admin"), crearPropuesta);
router.patch("/:id", requireAuth, editarPropuesta);
router.delete("/:id", requireAuth, deletePropuesta);
router.post("/expire", requireAuth, expirePropuestas);
export default router;
