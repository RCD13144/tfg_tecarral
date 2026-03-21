import { Router } from "express";
import {
  verPresupuestoReparacionHtml,
  aceptarPresupuestoReparacion,
  rechazarPresupuestoReparacion,
} from "../controllers/publicPresupuestoReparacion.controller.js";

const router = Router();

router.get("/presupuestos-reparacion/:token", verPresupuestoReparacionHtml);
router.post(
  "/presupuestos-reparacion/:token/accept",
  aceptarPresupuestoReparacion
);
router.post(
  "/presupuestos-reparacion/:token/reject",
  rechazarPresupuestoReparacion
);

export default router;