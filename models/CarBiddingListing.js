const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const CarBiddingSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    CarId: { type: Schema.Types.ObjectId, ref: "CarListing" },
    biddingAmount: { type: Number, required: true },
  },
  {
    timestamps: {
      createdAt: "created_on",
      updatedAt: "updated_on",
    },
  }
);

const CarBidding = model("CarBidding", CarBiddingSchema);

module.exports = CarBidding;
