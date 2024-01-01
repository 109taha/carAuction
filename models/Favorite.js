const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const FavoriteSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    listing_id: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
    }
});

const Favorite = model("Favorite", FavoriteSchema);

module.exports = Favorite;