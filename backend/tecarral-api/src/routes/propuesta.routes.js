import { Router } from "express";
import {crearPropuesta, editarPropuesta, deletePropuesta} from "../controllers/propuesta.controller.js"

const router = Router();

router.post("/", crearPropuesta);
router.patch("/:id", editarPropuesta);
router.delete("/:id", deletePropuesta);
export default router;