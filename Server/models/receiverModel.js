/*
    Receiver model
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const receiverSchema = new Schema({
  name: { type: String, required: true },
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
  building: { type: String, required: true },
  userId: { type: String, required: true },
});

const receiver = mongoose.model("Receiver", receiverSchema);

module.exports = { receiver };
