import { Router } from "express";
import {getMaquinaria, getMaquinariaById} from "../controllers/maquinas.controller.js"

const router = Router(); 


router.get("/", getMaquinaria);
router.get("/:id", getMaquinariaById);
export default router;