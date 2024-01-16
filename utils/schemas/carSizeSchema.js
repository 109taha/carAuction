const Joi = require("joi");

const sizeCarSchema = Joi.object({
  images: Joi.forbidden().messages({
    "any.unknown": "Images have to be sent as a file field",
  }),

  carSize: Joi.string()
    .max(70)
    .required()
    .valid(
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
      "Van"
    ),
});

module.exports = sizeCarSchema;
