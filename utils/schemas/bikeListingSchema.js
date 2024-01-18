const BikeFeature = require("../../models/BikeFeature");
const BikeBrand = require("../../models/BikeBrand");
const BikeModel = require("../../models/BikeModel");
const City = require("../../models/City");
const Joi = require("joi");

const validateFeatures = async (idArray, helpers) => {
  const allFeatures = await BikeFeature.getAllFeatureIds();
  const isValid = idArray.every((element) => allFeatures.includes(element));
  if (!isValid) return helpers.message("Feature set isn't valid");
  return idArray;
};

const validateBrand = async (idValue, helpers) => {
  const allBrandIds = await BikeBrand.getAllBrandIds();
  const isValid = allBrandIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid brand");
  return idValue;
};

const validateModel = async (idValue, helpers) => {
  const { brand: brandId } = helpers.state.ancestors[0];
  const allModelIdsByBrand = await BikeModel.getAllModelIdsByBrand(brandId);
  const isValid = allModelIdsByBrand.includes(idValue);
  if (!isValid) return helpers.message("Invalid model");
  return idValue;
};

const validateLocation = async (idValue, helpers) => {
  const allCityIds = await City.getAllCityIds();
  const isValid = allCityIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid city");
  return idValue;
};

const bikeListingSchema = Joi.object({
  title: Joi.string().min(3).max(70).required(),

  description: Joi.string().min(10).max(1000).required(),

  features: Joi.array()
    .items(Joi.string().pattern(/^[a-f\d]{24}$/i))
    .unique()
    .external(validateFeatures),

  location: Joi.string().required(),

  brand: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .external(validateBrand),

  model: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .external(validateModel),

  model_year: Joi.number().min(1940).max(new Date().getFullYear()).required(),

  registration_city: Joi.string().required(),

  condition: Joi.string().valid("new", "used").required(),

  price: Joi.number().min(0).required(),

  distance_driven: Joi.number().min(0).required(),

  engine_type: Joi.string()
    .valid("2 stroke", "4 stroke", "electric")
    .required(),

  images: Joi.forbidden().messages({
    "any.unknown": "Images have to be sent as a file field",
  }),
});

module.exports = bikeListingSchema;
