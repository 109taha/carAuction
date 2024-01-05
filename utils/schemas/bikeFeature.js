const Joi = require("joi");

const featureBikeSchema = Joi.object({
  name: Joi.string().max(70).required(),
});

module.exports = featureBikeSchema;
