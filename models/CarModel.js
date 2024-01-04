const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const CarBrand = require("./CarBrand");

const CarModelSchema = new Schema({
  brand: {
    type: Schema.Types.ObjectId,
    ref: "CarBrand",
    index: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
});

CarModelSchema.statics.getAllModelIdsByBrand = async (brandId) => {
  const foundBrand = await CarBrand.findById(brandId);
  const foundModelsArray = await CarModel.find({ brand: foundBrand });
  const modelIdsArray = foundModelsArray.map((obj) => obj._id.toString());
  return modelIdsArray;
};

const CarModel = model("CarModel", CarModelSchema);

module.exports = CarModel;
