import { Router } from "express";
import {
  verPropuestaHtml,
  aceptarPropuesta,
  rechazarPropuesta,
} from "../controllers/publicPropuesta.controller.js";

const router = Router();

router.get("/propuestas/:token", verPropuestaHtml);
router.post("/propuestas/:token/accept", aceptarPropuesta);
router.post("/propuestas/:token/reject", rechazarPropuesta);

export default router;
