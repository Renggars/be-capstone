// src/validations/group.validation.js

import Joi from "joi";

const joinByCode = {
  body: Joi.object().keys({
    invite_code: Joi.string().required(),
  }),
};

const createGroup = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    is_public: Joi.alternatives().try(Joi.boolean(), Joi.string()).required(),
    rules: Joi.any().optional(),
    image_url: Joi.string().allow("").optional(),
    image: Joi.any().optional(),
  }),
};

const updateGroup = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      category: Joi.string().optional(),
      is_public: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
      rules: Joi.any().optional(),
      image_url: Joi.string().allow("").optional(),
      image: Joi.any().optional(),
    })
    .min(1),
};

const listGroups = {
  query: Joi.object().keys({
    search: Joi.string().allow("").optional(),
    category: Joi.string().allow("").optional(),
  }),
};

export default { joinByCode, listGroups, createGroup, updateGroup };
