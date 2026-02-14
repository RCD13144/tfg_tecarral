import { Router } from "express";
import {getMaquinaria, getMaquinariaById, suggestModelo, suggestMarca, 
    suggestSubtipo, suggestNS, suggestMotor, suggestTipo, crearMaquina, 
    editarMaquinariaById, deleteMaquinariaById, markDelivered, marcarUbicacionTaller,
  marcarUbicacionAlmacen, recomputeLogistics, moverATaller, moverAAlmacen} from "../controllers/maquinas.controller.js"

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
router.get("/:id", getMaquinariaById);
router.post("/:id/mark-delivered", markDelivered);
router.post("/:id/location/taller", marcarUbicacionTaller);
router.post("/:id/location/almacen", marcarUbicacionAlmacen);
router.post("/recompute-logistics", recomputeLogistics);
router.post("/:id/move/taller", moverATaller);
router.post("/:id/move/almacen", moverAAlmacen);
export default router;