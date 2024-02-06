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
    packageId: { type: String, required: true },
    receiverId: { type: String, required: true },
    userId: { type: String, required: true },
    driverId: { type: String, required: true },
    orderStatus: { type: String, required: true },
  },
  { timestamps: true }
);

const order = mongoose.model("Order", orderSchema);

module.exports = { order };
