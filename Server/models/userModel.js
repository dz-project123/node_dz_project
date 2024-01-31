/*
    User models
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: { type: String, require: true },
  lastName: { type: String, require: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    type: Number,
    unique : true,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
