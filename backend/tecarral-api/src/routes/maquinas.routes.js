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

router.get("/suggest/modelo", requireAuth, suggestModelo);
router.get("/suggest/marca", requireAuth, suggestMarca);
router.get("/suggest/subtipo", requireAuth, suggestSubtipo);
router.get("/suggest/ns", requireAuth, suggestNS);
router.get("/suggest/motor", requireAuth, suggestMotor);
router.get("/suggest/tipo", requireAuth, suggestTipo);

router.post("/recompute-logistics", requireAuth, recomputeLogistics);

router.post("/", requireAuth, crearMaquina);

router.get("/:id", requireAuth,  getMaquinaById);        
router.patch("/:id", requireAuth, editarMaquinariaById);
router.delete("/:id", requireAuth, deleteMaquinariaById);

router.post("/:id/mark-delivered", requireAuth, markDelivered);
router.patch("/:id/maintenance-status", requireAuth, cambiarMaintenanceStatus);
router.post("/:id/abrir-incidencia", requireAuth, abrirIncidencia);
router.patch("/:id/escalar-grave", requireAuth, escalarAveriaGrave);
router.post("/:id/location/taller", requireAuth, marcarUbicacionTaller);
router.post("/:id/location/almacen", requireAuth, marcarUbicacionAlmacen);
router.post("/:id/move/taller", requireAuth, moverATaller);
router.post("/:id/move/almacen", requireAuth, moverAAlmacen);

export default router;