const mongoose = require("mongoose");
const CarSizeSchema = new mongoose.Schema({
  carSize: {
    type: String,
    required: true,
    enum: [
      "Compact hatchback",
      "Compact sedan",
      "Compact SUV",
      "Double Cabin",
      "High Roof",
      "Micro Van",
      "Mini Van",
      "Mini Vehicles",
      "Off-Road Vehicles",
      "Pick Up",
      "Single Cabin",
      "Station Wagon",
      "Convertible",
      "Coupe",
      "Crossover",
      "Hatchback",
      "MPV",
      "Sedan",
      "SUV",
      "Truck",
      "Van",
    ],
  },
  pic: {
    type: String,
    required: true,
  },
});

const CarSize = mongoose.model("CarSize", CarSizeSchema);

module.exports = CarSize;
