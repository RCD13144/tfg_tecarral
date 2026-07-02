import express, { Router } from "express";
import {
  signPublicContractController,
  viewPublicContractHtmlController,
} from "../controllers/serviceContract.controller.js";

const router = Router();

router.get("/contratos-mantenimiento/:token", viewPublicContractHtmlController);
router.post(
  "/contratos-mantenimiento/:token/sign",
  express.urlencoded({ extended: false, limit: "10mb" }),
  signPublicContractController
);

export default router;
