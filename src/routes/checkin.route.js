// src/routes/checkin.route.js

import express from "express";
import { auth } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import checkinValidation from "../validations/checkin.validation.js";
import checkinController from "../controllers/checkin.controller.js";

const router = express.Router();

// Semua route dilindungi JWT
router.get("/today", auth(), checkinController.getToday);
router.post("/", auth(), validate(checkinValidation.createCheckin), checkinController.create);
router.get(
  "/history",
  auth(),
  validate(checkinValidation.getHistory),
  checkinController.getHistory,
);

export default router;
