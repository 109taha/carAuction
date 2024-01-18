const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { customAlphabet } = require("nanoid");
const replaceSpacesWithDashes = require("../utils/replaceSpacesWithDashes");

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MAX_IMAGES = 20; // Limits the maximum number of image links that can be added
const nanoid = customAlphabet(ALPHABET, 16);

const BikeListingSchema = new Schema(
  {
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
          ref: "BikeFeature",
        },
      ],
    },
    location: {
      type: String,
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "BikeBrand",
      index: true,
      required: true,
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: "BikeModel",
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
      type: Schema.Types.ObjectId,
      ref: "City",
      index: true,
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    distance_driven: {
      type: Number,
      min: 0,
      required: true,
    },
    engine_type: {
      type: String,
      enum: ["2 stroke", "4 stroke", "electric"],
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
      default: "active",
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

BikeListingSchema.pre("validate", async function (next) {
  if (this.isNew) {
    let newLinkId = `${replaceSpacesWithDashes(this.title)}-${nanoid()}`;
    const uniqueCheck = true;
    while (uniqueCheck) {
      const existingListing = await BikeListing.findOne({ link_id: newLinkId });
      if (!existingListing) {
        this.link_id = newLinkId;
        return next();
      }
      newLinkId = `${replaceSpacesWithDashes(this.title)}-${nanoid()}`;
    }
  }
});

BikeListingSchema.path("images").validate(function (imgArray) {
  if (imgArray.length > MAX_IMAGES)
    throw new Error(
      `You can't upload more than ${MAX_IMAGES} images in a listing.`
    );
});

const BikeListing = model("BikeListing", BikeListingSchema);

module.exports = BikeListing;
