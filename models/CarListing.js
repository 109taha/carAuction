const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { customAlphabet } = require("nanoid");
const replaceSpacesWithDashes = require("../utils/replaceSpacesWithDashes");

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MAX_IMAGES = 7; // Limits the maximum number of image links that can be added
const nanoid = customAlphabet(ALPHABET, 16);

const CarListingSchema = new Schema(
  {
    addFor: {
      type: String,
      // required: true,
    },
    type: {
      type: String,
      require: true,
      enum: ["auction", "normal"],
    },
    carSize: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarSize",
      required: true,
    },
    bidding_starting_price: {
      type: Number,
      min: 0,
      required: function () {
        return this.type === "auction";
      },
    },
    current_bidding: {
      type: Schema.Types.ObjectId,
      ref: "CarBidding",
    },
    bidding_difference: {
      type: Number,
      min: 50,
      required: function () {
        return this.type === "auction";
      },
    },
    selling_price: {
      type: Number,
      min: 0,
      required: function () {
        return this.type === "auction";
      },
    },
    bidding_starting_date: {
      type: Date,
      required: function () {
        return this.type === "auction";
      },
    },
    bidding_ending_date: {
      type: Date,
      validate: {
        validator: function (value) {
          return (
            this.type !== "auction" ||
            (this.bidding_starting_date && value > this.bidding_starting_date)
          );
        },
        message: "Ending date must be greater than starting date",
      },
      required: function () {
        return this.type === "auction";
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    link_id: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "CarFeature",
        },
      ],
    },
    location: {
      type: String,
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "CarBrand",
      index: true,
      required: true,
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: "CarModel",
      index: true,
      required: true,
    },
    model_year: {
      type: Number,
      required: true,
      min: 1940,
      max: 2150,
    },
    registration_city: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "used", "accidental"],
      trim: true,
      required: true,
    },
    body_color: {
      type: String,
      enum: [
        "AQUA",
        "Anguri",
        "Aqua Blue",
        "Aqua Green",
        "Aqua green",
        "Beige",
        "Black",
        "Blue",
        "Bluish Silver",
        "British green",
        "Bronze",
        "Brown",
        "Burgundy",
        "Gold",
        "Golden",
        "Gray",
        "Green",
        "Grey",
        "Gun Metalic",
        "Gun Metallic",
        "Gun metallic",
        "Gun mettalic",
        "Ice blue",
        "Indigo",
        "Light Green",
        "Magenta",
        "Magneta",
        "Mahron",
        "Maroon",
        "Metalic Grey",
        "Metallic Green",
        "Metallic Grey",
        "Navy",
        "Olive Green",
        "Orange",
        "PEARL WHITE",
        "Pearl Black",
        "Pearl Blue",
        "Pearl Grey",
        "Pearl Sky Blue",
        "Pearl White",
        "Pearl black",
        "Pearl white",
        "Phantom Brown",
        "Pink",
        "Purple",
        "Red",
        "Red Vine",
        "Red Wine",
        "Red wine",
        "Rose Mist",
        "Royal blue",
        "SUPER WHITE",
        "Shalimar Rose",
        "Silver",
        "Sky Blue",
        "Sky blue",
        "Smoke Green",
        "Turquoise",
        "Unlisted",
        "Urban Titanium",
        "Urban titanium",
        "White",
        "White and black",
        "Yellow",
        "black",
        "blue",
        "blue metallic",
        "cream",
        "green",
        "green metallic",
        "grey",
        "gun matalic",
        "gun metallic",
        "light Green",
        "light blue",
        "light green",
        "maroon",
        "metalic green",
        "metallic",
        "metallic green",
        "olive green",
        "pearl white",
        "peral white",
        "red wine",
        "rose mist",
        "shalimar rose",
        "silver",
        "sky blue",
        "smoke green",
        "turwouise",
        "unlisted",
        "urban Titanium",
        "urban titanium",
        "white",
        "wine red",
      ],
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: function () {
        return this.type === "normal";
      },
    },
    distance_driven: {
      type: Number,
      min: 0,
      required: true,
    },
    fuel_type: {
      type: String,
      enum: [
        "Regular 87 octane gasoline",
        "Diesel",
        "Ethanol",
        "Hydrogen",
        "Gasoline",
        "Methanol",
        "Octane gasoline",
        "Biodiesel",
        "Natural gas",
      ],
      required: true,
    },
    engine_capacity: {
      type: Number,
      min: 0,
    },
    battery_capacity: {
      type: Number,
      min: 0,
    },
    transmission_type: {
      type: String,
      enum: ["automatic", "manual"],
      required: true,
    },
    assembly: {
      type: String,
      enum: ["local", "imported"],
      required: true,
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          public_id: {
            type: String,
            required: true,
          },
        },
      ],
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "awaiting approval"],
      default: "awaiting approval",
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_on",
      updatedAt: "updated_on",
    },
  }
);

CarListingSchema.pre("validate", async function (next) {
  if (this.isNew) {
    let newLinkId = `${replaceSpacesWithDashes(this.title)}-${nanoid()}`;
    const uniqueCheck = true;
    while (uniqueCheck) {
      const existingListing = await CarListing.findOne({ link_id: newLinkId });
      if (!existingListing) {
        this.link_id = newLinkId;
        return next();
      }
      newLinkId = `${replaceSpacesWithDashes(this.title)}-${nanoid()}`;
    }
  }
});

CarListingSchema.pre("validate", async function (next) {
  const engineVehicles = [
    "Regular 87 octane gasoline",
    "Diesel",
    "Ethanol",
    "Gasoline",
    "Methanol",
    "Octane gasoline",
    "Biodiesel",
    "Natural gas",
  ];
  if (
    (engineVehicles.includes(this.fuel_type) && this.engine_capacity === 0) ||
    (this.fuel_type === "Hydrogen" && this.battery_capacity === 0)
  ) {
    return next(new Error("Engine/battery capacity cannot be 0"));
  }
  next();
});

CarListingSchema.path("images").validate(function (imgArray) {
  if (imgArray.length > MAX_IMAGES)
    throw new Error(`You can't upload more than ${MAX_IMAGES} images`);
});

const CarListing = model("CarListing", CarListingSchema);

module.exports = CarListing;
