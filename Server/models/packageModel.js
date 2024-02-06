/*
    Package model
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const packageSchema = new Schema({
  name: { type: String, required: true },
  weight: { type: Number, required: true },
  dimension: {
    length: { type: Number, required: true },
    breadth: { type: Number, required: true },
    height: { type: Number, required: true },
  },
});

const package = mongoose.model("Package", packageSchema);

module.exports = { package };
