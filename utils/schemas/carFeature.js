const Joi = require("joi");

const featureCarSchema = Joi.object({
  name: Joi.string().max(70).required(),
});

module.exports = featureCarSchema;
