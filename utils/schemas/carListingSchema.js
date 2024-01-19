const CarFeature = require("../../models/CarFeature");
const CarBrand = require("../../models/CarBrand");
const CarModel = require("../../models/CarModel");
const City = require("../../models/City");
const Joi = require("joi");

const validateFeatures = async (idArray, helpers) => {
  const allFeatureIds = await CarFeature.getAllFeatureIds();
  const isValid = idArray.every((element) => allFeatureIds.includes(element));
  if (!isValid) return helpers.message("Feature set isn't valid");
  return idArray;
};

const validateBrand = async (idValue, helpers) => {
  const allBrandIds = await CarBrand.getAllBrandIds();
  const isValid = allBrandIds.includes(idValue);
  if (!isValid) return helpers.message("Invalid brand");
  return idValue;
};

const validateModel = async (idValue, helpers) => {
  const { brand: brandId } = helpers.state.ancestors[0];
  const allModelIdsByBrand = await CarModel.getAllModelIdsByBrand(brandId);
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

const validateEngineCapacity = (value, helpers) => {
  const { fuel_type: fuelType, battery_capacity: batteryCapacity } =
    helpers.state.ancestors[0];
  const engineVehicles = ["petrol", "diesel", "lpg", "cng", "hybrid"];
  if (engineVehicles.includes(fuelType) && batteryCapacity > 0)
    return helpers.message(
      "Battery capacity cannot be greater than 0 for engine vehicles"
    );
  if (engineVehicles.includes(fuelType) && value === 0) {
    return helpers.message("Engine capacity cannot be 0 for engine vehicles");
  }
  return value;
};

const validateBatteryCapacity = (value, helpers) => {
  const { fuel_type: fuelType, engine_capacity: engineCapacity } =
    helpers.state.ancestors[0];
  if (fuelType === "electric" && engineCapacity > 0)
    return helpers.message(
      "Engine capacity cannot be greater than 0 for electric vehicles"
    );
  if (fuelType === "electric" && value === 0) {
    return helpers.message(
      "Battery capacity cannot be 0 for electric vehicles"
    );
  }
  return value;
};

const carListingSchema = Joi.object({
  type: Joi.string().valid("auction", "normal").required(),
  carSize: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required(),

  bidding_starting_price: Joi.when("type", {
    is: "auction",
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),

  bidding_difference: Joi.when("type", {
    is: "auction",
    then: Joi.number().min(50).required(),
    otherwise: Joi.forbidden(),
  }),

  selling_price: Joi.when("type", {
    is: "auction",
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),

  bidding_starting_date: Joi.when("type", {
    is: "auction",
    then: Joi.date().iso().required(),
    otherwise: Joi.forbidden(),
  }),

  bidding_ending_date: Joi.when("type", {
    is: "auction",
    then: Joi.date().iso().greater(Joi.ref("bidding_starting_date")).required(),
    otherwise: Joi.forbidden(),
  }),

  title: Joi.string().min(3).max(70).required(),

  description: Joi.string().min(10).max(1000).required(),

  features: Joi.array()
    .items(Joi.string().pattern(/^[a-f\d]{24}$/i))
    .required()
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

  condition: Joi.string().valid("new", "used", "accidental").required(),

  body_color: Joi.string()
    .valid(
      "AQUA",
      "Anguri",
      "Aqua Blue",
      "Aqua Green",
      "Aqua green",
      "Beige",
      "Black",
      "Blue",
      "Bluish Silver",
      "British green",
      "Bronze",
      "Brown",
      "Burgundy",
      "Gold",
      "Golden",
      "Gray",
      "Green",
      "Grey",
      "Gun Metalic",
      "Gun Metallic",
      "Gun metallic",
      "Gun mettalic",
      "Ice blue",
      "Indigo",
      "Light Green",
      "Magenta",
      "Magneta",
      "Mahron",
      "Maroon",
      "Metalic Grey",
      "Metallic Green",
      "Metallic Grey",
      "Navy",
      "Olive Green",
      "Orange",
      "PEARL WHITE",
      "Pearl Black",
      "Pearl Blue",
      "Pearl Grey",
      "Pearl Sky Blue",
      "Pearl White",
      "Pearl black",
      "Pearl white",
      "Phantom Brown",
      "Pink",
      "Purple",
      "Red",
      "Red Vine",
      "Red Wine",
      "Red wine",
      "Rose Mist",
      "Royal blue",
      "SUPER WHITE",
      "Shalimar Rose",
      "Silver",
      "Sky Blue",
      "Sky blue",
      "Smoke Green",
      "Turquoise",
      "Unlisted",
      "Urban Titanium",
      "Urban titanium",
      "White",
      "White and black",
      "Yellow",
      "black",
      "blue",
      "blue metallic",
      "cream",
      "green",
      "green metallic",
      "grey",
      "gun matalic",
      "gun metallic",
      "light Green",
      "light blue",
      "light green",
      "maroon",
      "metalic green",
      "metallic",
      "metallic green",
      "olive green",
      "pearl white",
      "peral white",
      "red wine",
      "rose mist",
      "shalimar rose",
      "silver",
      "sky blue",
      "smoke green",
      "turwouise",
      "unlisted",
      "urban Titanium",
      "urban titanium",
      "white",
      "wine red"
    )
    .required(),

  price: Joi.when("type", {
    is: "normal",
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),

  distance_driven: Joi.number().min(0).required(),

  fuel_type: Joi.string()
    .valid(
      "Regular 87 octane gasoline",
      "Diesel",
      "Ethanol",
      "Hydrogen",
      "Gasoline",
      "Methanol",
      "Octane gasoline",
      "Biodiesel",
      "Natural gas"
    )
    .required(),

  engine_capacity: Joi.number()
    .min(0)
    .optional()
    .external(validateEngineCapacity),

  battery_capacity: Joi.number()
    .min(0)
    .optional()
    .external(validateBatteryCapacity),

  transmission_type: Joi.string().valid("automatic", "manual").required(),

  assembly: Joi.string().valid("local", "imported").required(),

  images: Joi.forbidden().messages({
    "any.unknown": "Images have to sent as a file field",
  }),
});

module.exports = carListingSchema;
