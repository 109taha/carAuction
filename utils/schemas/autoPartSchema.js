const CarBrand = require("../../models/CarBrand");
const CarModel = require("../../models/CarModel");
const AutoPartSubCategory = require("../../models/AutoPartSubCategory");
const AutoPartCategory = require("../../models/AutoPartCategory");
const Joi = require("joi");

const validateBrand = async (idValue, helpers) => {
  if (!idValue) return null;
  const allBrandIds = await CarBrand.getAllBrandIds();
  const isValid = allBrandIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid brand");
  return idValue;
};

const validateAutoPartCategory = async (idValue, helpers) => {
  const allCatIds = await AutoPartCategory.getAllCatIds();
  const isValid = allCatIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid Auto Part Category");
  return idValue;
};

const validateAutoPartSubCategory = async (idValue, helpers) => {
  const allSubCatIds = await AutoPartSubCategory.getAllSubCatIds();
  const isValid = allSubCatIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid Auto Part Sub Category");
  return idValue;
};

const validateModel = async (idValue, helpers) => {
  if (!idValue) return null;
  const { brand: brandId } = helpers.state.ancestors[0];
  const allModelIdsByBrand = await CarModel.getAllModelIdsByBrand(brandId);
  const isValid = allModelIdsByBrand.includes(idValue);
  if (!isValid) return helpers.message("Invalid model");
  return idValue;
};

const autoPartSchema = Joi.object({
  title: Joi.string().max(70).required(),

  description: Joi.string().max(1000).required(),

  category: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .external(validateAutoPartCategory),

  sub_category: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .external(validateAutoPartSubCategory),

  brand: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .external(validateBrand),

  model: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .external(validateModel),

  price: Joi.number().min(0).required(),

  images: Joi.forbidden().messages({
    "any.unknown": "Images have to sent as a file field",
  }),
});

module.exports = autoPartSchema;
