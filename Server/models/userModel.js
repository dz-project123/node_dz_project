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
    required: true,
  },
  address: {
    type: Object, // Assuming your JSON data is an object
    required: true,
  },
  // address: {
  //   title: { type: String, required: true },
  //   lattitude: { type: Number, required: true },
  //   longitude: { type: Number, required: true },
  // },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
