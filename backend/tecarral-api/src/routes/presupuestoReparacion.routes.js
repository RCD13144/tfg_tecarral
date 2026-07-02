import { Router } from "express";
import {
  crearPresupuestoReparacion,
  getPresupuestoReparacionById,
  listPresupuestosReparacion,
  signPresupuestoTecarral,
} from "../controllers/presupuestoReparacion.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/roles.middleware.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.get("/", requireAuth, listPresupuestosReparacion);
router.post("/", requireAuth, requireRole(ROLES.ADMIN, ROLES.TECNICO), crearPresupuestoReparacion);
router.get("/:id", requireAuth, getPresupuestoReparacionById);
router.post("/:id/sign-tecarral", requireAuth, signPresupuestoTecarral);

export default router;

