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
  contact: {
    type: Number,
    unique: true,
    required: true,
  },
  address: {
    type: Object, // Assuming your JSON data is an object
    required: true,
  },
  license: {
    number: { type: String },
    expirationDate: { type: Date },
  },
  availability: { type: Boolean },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    geoHash: { type: String },
  },
  vehicle: {
    registrationNumber: { type: String },
    type: { type: String },
    // insurance: {
    //   provider: { type: String},
    //   expirationDate: { type: Date, required: true }
    // },
  },
  ratings: {
    averageRating: Number,
    reviews: [
      { user: String, comment: String, rating: Number, timestamp: Date },
    ],
  },
  forgotPasswordOtp: { type: Number,required:false},
  bankDetails:{
    type: Object,
    required: false
  },
  ratingSum: {
    type: Number,
    required: false,
    default: 0
  },
  ratingCount:{
    type: Number,
    required: false,
    default: 0
  }
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = { Driver };
