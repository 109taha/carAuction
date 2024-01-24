const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MAX_IMAGES = 5;

const AutoPartListingSchema = new Schema(
  {
    addFor: {
      type: String,
      required: true,
      defualt: "AutoPart",
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
    description: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "AutoPartCategory",
      required: true,
    },
    sub_category: {
      type: Schema.Types.ObjectId,
      ref: "AutoPartSubCategory",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "CarBrand",
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: "CarModel",
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
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

AutoPartListingSchema.path("images").validate(function (imgArray) {
  if (imgArray.length > MAX_IMAGES)
    throw new Error(`You can't upload more than ${MAX_IMAGES} images`);
});

const AutoPartsListing = model("AutoPartListing", AutoPartListingSchema);

module.exports = AutoPartsListing;
