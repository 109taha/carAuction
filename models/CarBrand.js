const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CarBrandSchema = new Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        index: true,
        required: true
    },
    image: {
        type: String,
        trim: true,
        required: true
    }
});

CarBrandSchema.statics.getAllBrandIds = async () => {
    const brandsArray = await CarBrand.find({});
    const brandIdsArray = brandsArray.map(obj => obj._id.toString());
    return brandIdsArray;
};

const CarBrand = model("CarBrand", CarBrandSchema);

module.exports = CarBrand;