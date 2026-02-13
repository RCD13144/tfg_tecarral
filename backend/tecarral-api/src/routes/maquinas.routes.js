import { Router } from "express";
import {getMaquinaria, getMaquinariaById, suggestModelo, suggestMarca, suggestSubtipo, suggestNS, suggestMotor, suggestTipo, crearMaquina, editarMaquinariaById, deleteMaquinariaById} from "../controllers/maquinas.controller.js"

const router = Router(); 


router.get("/", getMaquinaria);
router.get("/suggest/modelo", suggestModelo);
router.get("/suggest/marca", suggestMarca);
router.get("/suggest/subtipo", suggestSubtipo);
router.get("/suggest/ns", suggestNS);
router.get("/suggest/motor", suggestMotor);
router.get("/suggest/tipo", suggestTipo);
router.post("/", crearMaquina);
router.patch("/:id", editarMaquinariaById);
router.delete("/:id", deleteMaquinariaById);
router.get("/:id", getMaquinariaById);;
export default router;