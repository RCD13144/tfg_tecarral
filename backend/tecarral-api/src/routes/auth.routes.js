import { Router } from "express";
import {
  login,
  changeTemporaryPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/change-temporary-password", changeTemporaryPassword);

export default router;