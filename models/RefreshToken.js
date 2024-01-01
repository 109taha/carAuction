const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const RefreshTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        index: true
    }
});

RefreshTokenSchema.pre("save", async function(next) {
    const user = this.user;
    try {
        await RefreshToken.findOneAndDelete({ user });
        return next();
    } catch(err) {
        return next(err);
    }
});

const RefreshToken = model("RefreshToken", RefreshTokenSchema);

module.exports = RefreshToken;