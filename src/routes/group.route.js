// src/routes/group.route.js

import express from "express";
import { auth } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import groupValidation from "../validations/group.validation.js";
import groupController from "../controllers/group.controller.js";
import { uploadGroup } from "../utils/multer.js";

const router = express.Router();

// Semua route dilindungi JWT
router.get("/", auth(), validate(groupValidation.listGroups), groupController.listGroups);
router.get("/joined", auth(), groupController.getJoinedGroups);
router.post(
  "/",
  auth(),
  uploadGroup.single("image"),
  validate(groupValidation.createGroup),
  groupController.create,
);

// PENTING: route statis 'join-by-code' harus di atas route dinamis ':id'
// agar Express tidak menginterpretasikan 'join-by-code' sebagai ID grup
router.post(
  "/join-by-code",
  auth(),
  validate(groupValidation.joinByCode),
  groupController.joinByCode,
);

router.get("/:id", auth(), groupController.getGroupDetail);
router.get("/:id/report", auth(), groupController.getReport);
router.patch(
  "/:id",
  auth(),
  uploadGroup.single("image"),
  validate(groupValidation.updateGroup),
  groupController.update,
);
router.post("/:id/join", auth(), groupController.joinGroup);
router.delete("/:id/members/:userId", auth(), groupController.removeMember);

export default router;
