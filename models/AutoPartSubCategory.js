const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AutoPartSubCategorySchema = new Schema({
  category: {
    type: Schema.Types.ObjectId,
    ref: "AutoPartCategory",
    index: true,
    required: true,
  },
  name: {
    type: String,
    unique: true,
    required: true,
  },
});

AutoPartSubCategorySchema.statics.getAllSubCatIds = async () => {
  const subCatArray = await AutoPartSubCategory.find({});
  const subCarIdsArray = subCatArray.map((obj) => obj._id.toString());
  return subCarIdsArray;
};

const AutoPartSubCategory = model(
  "AutoPartSubCategory",
  AutoPartSubCategorySchema
);

module.exports = AutoPartSubCategory;
