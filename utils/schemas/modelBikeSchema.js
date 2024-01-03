const Joi = require("joi");
const BikeBrand = require("../../models/BikeBrand");

const validateBrand = async (idValue, helpers) => {
  const allBrandIds = await BikeBrand.getAllBrandIds();
  const isValid = allBrandIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid brand");
  return idValue;
};

const modelBikeSchema = Joi.object({
  brand: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .external(validateBrand),

  name: Joi.string().max(70).required(),
});

module.exports = modelBikeSchema;
