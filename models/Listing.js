const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    set: (v) =>
      v === ""
        ? "https://hips.hearstapps.com/hmg-prod/images/lpibo-ew-1656015868.jpg"
        : v,
    default: "https://hips.hearstapps.com/hmg-prod/images/lpibo-ew-1656015868.jpg"
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

// Create a listing model from Listing Schema
module.exports = new mongoose.model("Listing", listingSchema);
