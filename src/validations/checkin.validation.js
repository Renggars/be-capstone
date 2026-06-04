// src/validations/checkin.validation.js

import Joi from "joi";

const createCheckin = {
  body: Joi.object().keys({
    skor_kebahagiaan: Joi.number().integer().min(1).max(10).required(),
    waktu_tidur: Joi.number().min(0).max(24).required(),
    screen_time: Joi.number().min(0).max(24).required(),
    tingkat_olahraga: Joi.string().valid("Tidak Ada", "Kadang-kadang", "Rutin").required(),
    interaksi_sosial: Joi.number().integer().min(1).max(10).required(),
    waktu_kerja: Joi.number().min(0).max(24).required(),
  }),
};

const getHistory = {
  query: Joi.object().keys({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(new Date().getFullYear()).required(),
  }),
};

export default { createCheckin, getHistory };
