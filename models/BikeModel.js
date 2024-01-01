const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const BikeBrand = require("./BikeBrand");

const BikeModelSchema = new Schema({
    brand: {
        type: Schema.Types.ObjectId,
        ref: "BikeBrand",
        index: true,
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    }
});

BikeModelSchema.statics.getAllModelIdsByBrand = async (brandId) => {
    const foundBrand = await BikeBrand.findById(brandId);
    const foundModelsArray = await BikeModel.find({ brand: foundBrand });
    const modelIdsArray = foundModelsArray.map(obj => obj._id.toString());
    return modelIdsArray;
};

const BikeModel = model("BikeModel", BikeModelSchema);

module.exports = BikeModel;