const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    location: {
      type: String,
    },
    salt: {
      type: String,
      select: false,
      required: true,
    },
    hash: {
      type: String,
      select: false,
      required: true,
    },
    fcm_token: {
      type: String,
      trim: true,
    },
    savedCars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarListing",
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_on",
      updatedAt: "updated_on",
    },
  }
);

UserSchema.virtual("full_name").get(function () {
  return `${this.first_name} ${this.last_name}`;
});

const User = model("User", UserSchema);

module.exports = User;
