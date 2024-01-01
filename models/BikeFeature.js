const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BikeFeatureSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    }
});

BikeFeatureSchema.statics.getAllFeatureIds = async function() {
    const featuresArray = await BikeFeature.find({});
    const featureIdsArray = featuresArray.map(obj => obj._id.toString());
    return featureIdsArray;
};

const BikeFeature = model("BikeFeature", BikeFeatureSchema);

module.exports = BikeFeature;