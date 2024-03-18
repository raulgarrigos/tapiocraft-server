const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    refundPolicy: {
      type: String,
      trim: true,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
