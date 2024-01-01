const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AdminRegistrationTokenSchema = new Schema({
    token: {
        type: String,
        min: 25,
        max: 50,
        unique: true,
        index: true,
        required: true
    },
    expiry: {
        type: Date,
        required: true,
        default: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days from when the token is generated
    }
});

AdminRegistrationTokenSchema.statics.getAllTokens = async () => {
    const tokenObjsArray = await AdminRegistrationToken.find();
    const allTokens = tokenObjsArray.map(obj => obj.token);
    return allTokens;
};

const AdminRegistrationToken = model("AdminRegistrationToken", AdminRegistrationTokenSchema);

module.exports = AdminRegistrationToken;