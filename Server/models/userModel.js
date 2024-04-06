/*
    User models
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
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
  pincode: {
    type: Number,
    // required: true,
  },
  address: {
    type: Object, // Assuming your JSON data is an object
    required: true,
  },

  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    geoHash: { type: String },
  },
  forgotPasswordOtp: { type: Number,required:false},
  creditCard:{
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

const User = mongoose.model("User", userSchema);

module.exports = { User };
