// src/controllers/auth.controller.js

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import authService from "../services/auth.service.js";
import userService from "../services/user.service.js";
import tokenService from "../services/token.service.js";

/**
 * POST /auth/register
 * Daftar user baru
 */
const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);

  // Hapus password dari response
  delete user.password;

  res.status(httpStatus.CREATED).send({
    message: "Registration successful",
    data: { user, tokens },
  });
});

/**
 * POST /auth/login
 * Login dengan email & password
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  // Hapus password dari response
  delete user.password;

  res.send({
    message: "Login success",
    data: { user, tokens },
  });
});

/**
 * POST /auth/logout
 * Hapus refresh token (logout)
 */
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * POST /auth/refresh-tokens
 * Perbarui access token menggunakan refresh token
 */
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({
    message: "Tokens refreshed successfully",
    data: { tokens },
  });
});

/**
 * GET /auth/me
 * Get data user yang sedang login (butuh JWT)
 */
const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  // Hapus password dari response
  delete user.password;

  res.send({
    message: "Success",
    data: { user },
  });
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  getMe,
};
