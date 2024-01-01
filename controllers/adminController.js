const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// Models
const Admin = require("../models/Admin");
const AdminRegistrationToken = require("../models/AdminRegistrationToken");
const User = require("../models/User");
const City = require("../models/City");
const CarFeature = require("../models/CarFeature");
const CarBrand = require("../models/CarBrand");
const CarModel = require("../models/CarModel");
const CarListing = require("../models/CarListing");
const BikeFeature = require("../models/BikeFeature");
const BikeBrand = require("../models/BikeBrand");
const BikeModel = require("../models/BikeModel");
const BikeListing = require("../models/BikeListing");

// Joi schemas
const adminSchema = require("../utils/schemas/adminSchema");

// Utils and constants
const {
  genPasswordAndHash,
  validPassword,
} = require("../utils/handlePasswords");
const { issueAdminAccessToken } = require("../utils/adminJwts");

const ADMIN_ACCESS_PUB_KEY =
  process.env.A_ACCESS_PUB_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/admin/accessToken_public_key.pem"),
    { encoding: "utf8" }
  );

// Controller logic starts here

module.exports.handleAdminRegistration = async (req, res, next) => {
  console.log(req.body);
  const validatedBody = await adminSchema.validateAsync(req.body, {
    abortEarly: false,
  });
  const { token } = req.body;
  const regToken = await AdminRegistrationToken.findOne({ token });

  if (Date.now() > regToken.expiry) {
    res.json({
      success: false,
      message: "Your token has expired.",
    });
    return regToken.deleteOne();
  }

  const { hash, salt } = genPasswordAndHash(validatedBody.password);
  delete validatedBody.password;
  delete validatedBody.token;
  const adminData = {
    ...validatedBody,
    hash,
    salt,
  };

  const newAdmin = new Admin(adminData);
  await newAdmin.save();
  await regToken.deleteOne();

  return res.json({
    success: true,
    message: "Successfully registered",
  });
};

module.exports.handleAdminLogin = async (req, res, next) => {
  const { username, password } = req.body;
  const invalidResponse = {
    success: false,
    message: "Username or password is invalid",
  };
  const admin = await Admin.findOne({ username }).select("+salt +hash");
  if (!admin) return res.status(401).json(invalidResponse);

  const { hash, salt } = admin;

  const valid = validPassword(password, hash, salt);
  if (!valid) return res.status(401).json(invalidResponse);

  const accessTokenObj = issueAdminAccessToken(admin);

  return res.json({
    success: true,
    accessToken: accessTokenObj.accessToken,
    expires: accessTokenObj.expiresIn,
  });
};

module.exports.showUsers = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const skipping = (pageNumber - 1) * 50;
  const users = await User.find({})
    .sort({ created_on: -1 })
    .skip(skipping)
    .limit(50);
  const numberOfUsers = await User.countDocuments();

  return res.json({
    success: true,
    total: numberOfUsers,
    data: users,
  });
};

module.exports.showCities = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const cities = await City.find()
    .sort({ display: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfCities = await City.countDocuments();

  return res.json({
    success: true,
    total: numberOfCities,
    data: cities,
  });
};

module.exports.showCarBrands = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const brands = await CarBrand.find()
    .sort({ name: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfBrands = await CarBrand.countDocuments();

  return res.json({
    success: true,
    total: numberOfBrands,
    data: brands,
  });
};

module.exports.showCarModels = async (req, res, next) => {
  const { brandId } = req.params;
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const brand = await CarBrand.findById(brandId);
  if (!brand)
    return res.status(404).json({ success: false, message: "Brand not found" });
  const models = await CarModel.find({ brand })
    .sort({ name: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfModels = await CarModel.find({ brand }).countDocuments();

  return res.json({
    success: true,
    total: numberOfModels,
    data: models,
  });
};

module.exports.showCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const listings = await CarListing.find({})
    .sort({ created_on: -1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfListings = await CarListing.countDocuments();

  return res.json({
    success: false,
    total: numberOfListings,
    data: listings,
  });
};

module.exports.showBikeFeatures = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const features = await BikeFeature.find()
    .sort({ name: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfFeatures = await BikeFeature.countDocuments();

  return res.json({
    success: true,
    total: numberOfFeatures,
    data: features,
  });
};

module.exports.showBikeBrands = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const brands = await BikeBrand.find()
    .sort({ name: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfBrands = await BikeBrand.countDocuments();

  return res.json({
    success: true,
    total: numberOfBrands,
    data: brands,
  });
};

module.exports.showBikeModels = async (req, res, next) => {
  const { brandId } = req.params;
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const brand = await BikeBrand.findById(brandId);
  if (!brand)
    return res.status(404).json({ success: false, message: "Brand not found" });
  const models = await BikeModel.find({ brand })
    .sort({ name: 1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfModels = await BikeModel.find({ brand }).countDocuments();

  return res.json({
    success: true,
    total: numberOfModels,
    data: models,
  });
};

module.exports.showBikeListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const atATime = 50;
  const skipping = (pageNumber - 1) * atATime;
  const listings = await BikeListing.find({})
    .sort({ created_on: -1 })
    .skip(skipping)
    .limit(atATime);
  const numberOfListings = await BikeListing.countDocuments();

  return res.json({
    success: false,
    total: numberOfListings,
    data: listings,
  });
};
