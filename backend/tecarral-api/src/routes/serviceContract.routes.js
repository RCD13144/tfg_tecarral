import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  completeContractVisitController,
  createContractController,
  getContractController,
  getContractPdfController,
  listContractsController,
  listContractVisitsController,
  signContractTecarralController,
} from "../controllers/serviceContract.controller.js";

const router = Router();

router.get("/", requireAuth, listContractsController);
router.post("/", requireAuth, createContractController);
router.get("/:id/pdf", requireAuth, getContractPdfController);
router.get("/:id", requireAuth, getContractController);
router.post("/:id/sign-tecarral", requireAuth, signContractTecarralController);
router.get("/:id/visits", requireAuth, listContractVisitsController);
router.patch("/visits/:id/complete", requireAuth, completeContractVisitController);

export default router;

