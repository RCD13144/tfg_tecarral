import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { meController, createUserController } from "../controllers/users.controller.js";
import { requireRole } from "../middlewares/roles.middleware.js";


const router = Router();

router.get("/me", requireAuth, meController);
router.post("/", requireAuth, requireRole("admin"), createUserController)


export default router;
