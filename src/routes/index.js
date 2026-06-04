// src/routes/index.js

import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import checkinRoute from "./checkin.route.js";
import dashboardRoute from "./dashboard.route.js";
import groupRoute from "./group.route.js";

const router = express.Router();

// ============================================================
// API Routes
// ============================================================
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/checkins", checkinRoute);
router.use("/dashboard", dashboardRoute);
router.use("/groups", groupRoute);

export default router;
