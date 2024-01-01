const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BikeBrandSchema = new Schema({
    name: {
        type: String,
        unique: true,
        index: true,
        required: true,
        trim: true
    },
    image: {
        type: String,
        trim: true,
        required: true
    }
});

BikeBrandSchema.statics.getAllBrandIds = async () => {
    const brandsArray = await BikeBrand.find({});
    const brandIdsArray = brandsArray.map(obj => obj._id.toString());
    return brandIdsArray;
};

const BikeBrand = model("BikeBrand", BikeBrandSchema);

module.exports = BikeBrand;