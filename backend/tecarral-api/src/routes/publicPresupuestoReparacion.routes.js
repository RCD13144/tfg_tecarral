import express, { Router } from "express";
import {
  verPresupuestoReparacionHtml,
  aceptarPresupuestoReparacion,
  rechazarPresupuestoReparacion,
} from "../controllers/publicPresupuestoReparacion.controller.js";

const router = Router();

router.get("/presupuestos-reparacion/:token", verPresupuestoReparacionHtml);
router.post(
  "/presupuestos-reparacion/:token/accept",
  express.urlencoded({ extended: false, limit: "10mb" }),
  aceptarPresupuestoReparacion
);
router.post(
  "/presupuestos-reparacion/:token/reject",
  rechazarPresupuestoReparacion
);

export default router;
