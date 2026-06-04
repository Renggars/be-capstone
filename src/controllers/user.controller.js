// src/controllers/user.controller.js

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import userService from "../services/user.service.js";
import ApiError from "../utils/ApiError.js";

/**
 * GET /users/me
 * Ambil profil user yang sedang login
 */
const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  const { password, ...profile } = user;

  res.status(httpStatus.OK).send({
    success: true,
    message: "User profile retrieved successfully",
    data: profile,
  });
});

/**
 * PUT /users/me
 * Update nama atau avatar user yang sedang login
 */
const updateMe = catchAsync(async (req, res) => {
  const { name } = req.body;

  const updated = await userService.updateUserById(req.user.id, { name });

  const { password, ...profile } = updated;

  res.status(httpStatus.OK).send({
    success: true,
    message: "Profile updated successfully",
    data: profile,
  });
});

/**
 * POST /users/avatar
 * Upload avatar user yang sedang login
 */
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File avatar tidak ditemukan");
  }

  // Simpan path relatif ke database
  // path: public/uploads/avatars/filename...
  // yang diakses client: /uploads/avatars/filename...
  const avatarPath = `/uploads/avatars/${req.file.filename}`;

  const updated = await userService.updateUserById(req.user.id, { avatar: avatarPath });

  const { password, ...profile } = updated;

  res.status(httpStatus.OK).send({
    success: true,
    message: "Avatar uploaded successfully",
    data: profile,
  });
});

export default { getMe, updateMe, uploadAvatar };
