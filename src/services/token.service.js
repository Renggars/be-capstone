// src/services/token.service.js

import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import config from "../config/config.js";
import { tokenTypes } from "../config/tokens.js";
import prisma from "../../prisma/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * Generate JWT token
 * @param {number} userId
 * @param {Date} expires
 * @param {string} type - tokenTypes.ACCESS | tokenTypes.REFRESH
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expires.getTime() / 1000),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save token to database
 * @param {string} token
 * @param {number} userId
 * @param {Date} expires
 * @param {string} type
 * @param {boolean} [blacklisted=false]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => prisma.token.create({
  data: {
    token,
    userId,
    expires,
    type,
    blacklisted,
  },
});

/**
 * Verify token and return token doc from DB
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  if (payload.type !== type) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token type");
  }

  const tokenDoc = await prisma.token.findFirst({
    where: {
      token,
      type,
      userId: payload.sub,
      blacklisted: false,
    },
  });

  if (!tokenDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Token not found or already used");
  }

  return tokenDoc;
};

/**
 * Generate access and refresh tokens for a user
 * @param {User} user
 * @returns {Promise<{ access: { token, expires }, refresh: { token, expires } }>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = new Date(
    Date.now() + parseInt(config.jwt.accessExpirationMinutes) * 60 * 1000,
  );
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = new Date(
    Date.now() + parseInt(config.jwt.refreshExpirationDays) * 24 * 60 * 60 * 1000,
  );
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);

  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
};
