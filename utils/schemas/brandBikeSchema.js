const Joi = require("joi");

const brandBikeSchema = Joi.object({
  images: Joi.forbidden().messages({
    "any.unknown": "Images have to be sent as a file field",
  }),

  name: Joi.string().max(70).required(),
});

module.exports = brandBikeSchema;
