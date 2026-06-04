// src/validations/user.validation.js

import Joi from "joi";

const updateMe = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(100),
    age: Joi.number().integer().min(1).max(120),
    gender: Joi.string().valid("MALE", "FEMALE"),
  }),
};

export default { updateMe };
