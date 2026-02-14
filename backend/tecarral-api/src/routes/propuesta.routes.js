import { Router } from "express";
import {crearPropuesta, editarPropuesta, deletePropuesta, expirePropuestas} from "../controllers/propuesta.controller.js"

const router = Router();

router.post("/", crearPropuesta);
router.patch("/:id", editarPropuesta);
router.delete("/:id", deletePropuesta);
router.post("/expire", expirePropuestas);
export default router;