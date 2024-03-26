
const mongoose = require("mongoose");
const { Schema } = mongoose;

const communityRideOrderSchema = new Schema(
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
    communityRide: { type: mongoose.Schema.Types.ObjectId,
        ref: "CommunityRide",
       // required: true 
      },
    orderStatus: { type: [String], required: true },
    senderOtp: {type: Number},
    receiverOtp: {type: Number},
    isReceiverOtpRequired: {type: Boolean,default: false},
    metaData: {
      type: Object,
      required: false
    },
    userRating:{type: Number},
    driverRating:{type: Number},
    isUserRatingAvailable: {type: Boolean,default: false},
    isDriverRatingAvailable: {type: Boolean,default: false}
  },
  { timestamps: true }
);

const communityRideOrder = mongoose.model("communityRideOrder", communityRideOrderSchema);

module.exports = { communityRideOrder };
