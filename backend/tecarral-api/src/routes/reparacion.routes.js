import { Router } from "express";
import { getReparaciones, asignarAveria, marcarReparacionTerminada
} from "../controllers/reparacion.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/roles.middleware.js";
import {ROLES} from "../constants/roles.js"

const router = Router();

router.get("/", requireAuth, getReparaciones);
router.patch("/:id/asignar-averia", requireAuth, requireRole(ROLES.ADMIN), asignarAveria);
router.patch("/:id/terminar", requireAuth, marcarReparacionTerminada);

export default router;
