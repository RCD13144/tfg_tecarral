import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { meController } from "../controllers/users.controller.js";

const router = Router();

router.get("/me", requireAuth, meController);

export default router;
