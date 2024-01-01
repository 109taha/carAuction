const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const OrderSchema = new Schema({
  parts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPartListing",
      required: true,
    },
  ],
  address: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  total: { type: Number, required: true },
});

const Order = model("Order", OrderSchema);

module.exports = Order;
