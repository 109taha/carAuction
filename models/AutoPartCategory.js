const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AutoPartCategorySchema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    required: true,
  },
});

AutoPartCategorySchema.statics.getAllCatIds = async () => {
  const catArray = await AutoPartCategory.find({});
  const catIdsArray = catArray.map((obj) => obj._id.toString());
  return catIdsArray;
};

const AutoPartCategory = model("AutoPartCategory", AutoPartCategorySchema);

module.exports = AutoPartCategory;
