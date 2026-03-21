import { Router } from "express";
import {
  getMaquinaria,
  getMaquinaById,        
  suggestModelo,
  suggestMarca,
  suggestSubtipo,
  suggestNS,
  suggestMotor,
  suggestTipo,
  crearMaquina,
  editarMaquinariaById,
  deleteMaquinariaById,
  markDelivered,
  marcarUbicacionTaller,
  marcarUbicacionAlmacen,
  recomputeLogistics,
  moverATaller,
  moverAAlmacen,
  cambiarMaintenanceStatus, 
  abrirIncidencia, 
  escalarAveriaGrave
} from "../controllers/maquinas.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getMaquinaria);

router.get("/suggest/modelo", suggestModelo);
router.get("/suggest/marca", suggestMarca);
router.get("/suggest/subtipo", suggestSubtipo);
router.get("/suggest/ns", suggestNS);
router.get("/suggest/motor", suggestMotor);
router.get("/suggest/tipo", suggestTipo);

router.post("/recompute-logistics", recomputeLogistics);

router.post("/", crearMaquina);

router.get("/:id", getMaquinaById);        
router.patch("/:id", editarMaquinariaById);
router.delete("/:id", deleteMaquinariaById);

router.post("/:id/mark-delivered", markDelivered);
router.patch("/:id/maintenance-status", cambiarMaintenanceStatus);
router.post("/:id/abrir-incidencia", requireAuth, abrirIncidencia);
router.patch("/:id/escalar-grave", requireAuth, escalarAveriaGrave);
router.post("/:id/location/taller", marcarUbicacionTaller);
router.post("/:id/location/almacen", marcarUbicacionAlmacen);
router.post("/:id/move/taller", moverATaller);
router.post("/:id/move/almacen", moverAAlmacen);

export default router;