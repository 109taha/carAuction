const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const replaceSpacesWithDashes = require("../utils/replaceSpacesWithDashes");

const CitySchema = new Schema({
  display: {
    type: String,
    unique: true,
    trim: true,
    required: true,
    match: /^[A-Za-z ]+$/,
  },
  search_id: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z-]+$/,
    required: true,
  },
  icon: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/4783/4783446.png",
  },
});

CitySchema.pre("validate", async function (next) {
  const id = replaceSpacesWithDashes(this.display.toLowerCase());
  this.search_id = id;
  next();
});

CitySchema.statics.getAllCityIds = async () => {
  const citiesArray = await City.find();
  const cityIdsArray = citiesArray.map((obj) => obj._id.toString());
  return cityIdsArray;
};

const City = model("City", CitySchema);

module.exports = City;
