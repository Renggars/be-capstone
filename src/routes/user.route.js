// src/routes/user.route.js

import express from "express";
import { auth } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import userValidation from "../validations/user.validation.js";
import userController from "../controllers/user.controller.js";
import { uploadAvatar } from "../utils/multer.js";

const router = express.Router();

// Semua route dilindungi JWT
router.get("/me", auth(), userController.getMe);
router.put("/me", auth(), validate(userValidation.updateMe), userController.updateMe);
router.post("/avatar", auth(), uploadAvatar.single("avatar"), userController.uploadAvatar);

export default router;
