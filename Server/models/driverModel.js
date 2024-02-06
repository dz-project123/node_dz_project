/*
    Driver models
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const driverSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: Number,
    unique: true,
    required: true,
  },
  address: {
    current: { type: String, required: true },
    pincode: {
      type: Number,
      required: true,
    },
  },
  license: {
    number: { type: String, required: true },
    type: { type: String, required: true },
    issuingAuthority: { type: String, required: true },
    expirationDate: { type: Date, required: true },
  },
  availability: {
    status: String,
    lastOnline: Date,
  },
  vehichle: {
    registrationNumber: { type: String, required: true },
    type: { type: String, required: true },
    insurance: {
      provider: { type: String, required: true },
      expirationDate: { type: Date, required: true },
    },
  },
  ratings: {
    averageRating: Number,
    reviews: [
      { user: String, comment: String, rating: Number, timestamp: Date },
    ],
  },
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = { Driver };