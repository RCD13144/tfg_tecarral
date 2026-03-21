import { Router } from "express";
import {
  crearPresupuestoReparacion,
  getPresupuestoReparacionById
} from "../controllers/presupuestoReparacion.controller.js";

import {requireAuth} from "../middlewares/auth.middleware.js"
import {requireRole} from "../middlewares/roles.middleware.js"


const router = Router();

router.post("/", requireAuth, requireRole("ADMIN"), crearPresupuestoReparacion);
router.get("/:id", getPresupuestoReparacionById);

export default router;