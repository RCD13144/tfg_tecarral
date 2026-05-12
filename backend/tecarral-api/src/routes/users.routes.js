import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  meController,
  createUserController,
  listUsersController,
  updateMeController,
  deactivateUserController,
  changeMyPasswordController,
} from "../controllers/users.controller.js";
import { requireRole } from "../middlewares/roles.middleware.js";


const router = Router();

router.get("/me", requireAuth, meController);
router.patch("/me", requireAuth, updateMeController);
router.patch("/me/password", requireAuth, changeMyPasswordController);
router.get("/", requireAuth, requireRole("admin"), listUsersController);
router.post("/", requireAuth, requireRole("admin"), createUserController);
router.patch("/:id/deactivate", requireAuth, requireRole("admin"), deactivateUserController);


export default router;
