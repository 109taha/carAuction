const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CarFeatureSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  images: {
    type: String,
    required: true,
  },
});

CarFeatureSchema.statics.getAllFeatureIds = async function () {
  const featuresArray = await CarFeature.find({});
  const featureIdsArray = featuresArray.map((obj) => obj._id.toString());
  return featureIdsArray;
};

const CarFeature = model("CarFeature", CarFeatureSchema);

module.exports = CarFeature;
