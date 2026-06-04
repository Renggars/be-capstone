// src/routes/auth.route.js

import express from "express";
import { auth } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import authValidation from "../validations/auth.validation.js";
import authController from "../controllers/auth.controller.js";

const router = express.Router();

// Public routes (dengan rate limiter lebih ketat)
router.post("/register", authLimiter, validate(authValidation.register), authController.register);
router.post("/login", authLimiter, validate(authValidation.login), authController.login);
router.post("/logout", validate(authValidation.logout), authController.logout);
router.post(
  "/refresh-tokens",
  validate(authValidation.refreshTokens),
  authController.refreshTokens,
);

// Protected routes (butuh JWT)
router.get("/me", auth(), authController.getMe);

export default router;
