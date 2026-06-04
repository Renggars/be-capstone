// src/middlewares/rateLimiter.js

import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // max 100 requests per 15 minutes per IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: 429,
    message: "Too many requests, please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Lebih ketat untuk endpoint auth
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: 429,
    message: "Too many authentication attempts, please try again later.",
  },
});
