// src/services/user.service.js

import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import prisma from "../../prisma/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * Create a new user
 * @param {Object} userBody - { name, email, password, role? }
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const existingUser = await getUserByEmail(userBody.email);
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const hashedPassword = await bcrypt.hash(userBody.password, 10);

  const user = await prisma.user.create({
    data: {
      name: userBody.name,
      email: userBody.email,
      password: hashedPassword,
      age: userBody.age,
      gender: userBody.gender,
      role: userBody.role || "USER",
    },
  });

  return user;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User|null>}
 */
const getUserByEmail = async (email) =>
  prisma.user.findUnique({
    where: { email },
  });

/**
 * Get user by ID
 * @param {number} userId
 * @returns {Promise<User>}
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

/**
 * Update user by ID
 * @param {number} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  // Cek duplikat email jika ada perubahan email
  if (updateBody.email && updateBody.email !== user.email) {
    const existingUser = await getUserByEmail(updateBody.email);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
  }

  // Hash password jika ada perubahan
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateBody,
  });
};

export default {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserById,
};
