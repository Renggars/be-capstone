// src/routes/dashboard.route.js

import express from "express";
import { auth } from "../middlewares/auth.js";
import dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

// Semua route dilindungi JWT
router.get("/summary", auth(), dashboardController.getSummary);
router.get("/badges", auth(), dashboardController.getAllBadges);

export default router;
