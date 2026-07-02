import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  createLoanerAssignmentController,
  listLoanerAssignmentsController,
  updateLoanerAssignmentStateController,
} from "../controllers/loanerAssignment.controller.js";

const router = Router();

router.get("/", requireAuth, listLoanerAssignmentsController);
router.post("/", requireAuth, createLoanerAssignmentController);
router.patch("/:id/state", requireAuth, updateLoanerAssignmentStateController);

export default router;
