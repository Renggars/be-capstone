// src/validations/auth.validation.js

import Joi from "joi";

const register = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    age: Joi.number().integer().min(1).max(120).required(),
    gender: Joi.string().valid("MALE", "FEMALE").required(),
    role: Joi.string().valid("USER", "ADMIN").optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export default {
  register,
  login,
  logout,
  refreshTokens,
};
