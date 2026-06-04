// src/middlewares/auth.js

import passport from "passport";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";

const verifyCallback = (req, resolve, reject, requiredRoles) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
  }

  req.user = user;

  // Jika ada role yang dibutuhkan, cek apakah user memiliki role tersebut
  if (requiredRoles.length) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return reject(
        new ApiError(httpStatus.FORBIDDEN, "Forbidden: You do not have the required role"),
      );
    }
  }

  resolve();
};

/**
 * Auth middleware dengan optional role-based access control
 * Contoh:
 *   auth()            -> hanya cek JWT valid
 *   auth("ADMIN")     -> hanya untuk ADMIN
 *   auth("ADMIN", "USER") -> untuk ADMIN atau USER
 */
const auth = (...requiredRoles) => async (req, res, next) => new Promise((resolve, reject) => {
  passport.authenticate(
    "jwt",
    { session: false },
    verifyCallback(req, resolve, reject, requiredRoles),
  )(req, res, next);
})
  .then(() => next())
  .catch((err) => next(err));

export { auth };
