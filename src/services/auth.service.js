// src/services/auth.service.js

import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import prisma from "../../prisma/index.js";
import ApiError from "../utils/ApiError.js";
import userService from "./user.service.js";
import tokenService from "./token.service.js";
import { tokenTypes } from "../config/tokens.js";

/**
 * Login dengan email dan password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been deactivated");
  }

  return user;
};

/**
 * Logout - hapus refresh token dari DB
 * @param {string} refreshToken
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: tokenTypes.REFRESH,
      blacklisted: false,
    },
  });

  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Refresh token not found");
  }

  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<{ access, refresh }>}
 */
const refreshAuth = async (refreshToken) => {
  const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
  const user = await userService.getUserById(refreshTokenDoc.userId);

  // Hapus refresh token lama
  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });

  // Generate token baru
  return tokenService.generateAuthTokens(user);
};

export default {
  loginWithEmailAndPassword,
  logout,
  refreshAuth,
};
