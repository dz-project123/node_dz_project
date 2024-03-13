/*
    Order model,
    Beware of the transcation orders

    When order is done
    * When the driver is assigned follow the below mentioned order
    * Add package entry
    * Add entry to driver
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    description: { type: String, required: true },
    orderPrice: { type: Number, required: true },
    packageObj: {
      type: Object, // Assuming your JSON data is an object
      required: true,
    },
    // receiverId: { type: String, required: true },
    // userId: { type: String, required: true },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receiver",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //Ghansham Change
    driverId: { type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
     // required: true 
    },
    // orderStatus: { type: String, required: true },
    orderStatus: { type: [String], required: true },
    senderOtp: {type: Number},
    receiverOtp: {type: Number},
    isReceiverOtpRequired: {type: Boolean,default: false}
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
