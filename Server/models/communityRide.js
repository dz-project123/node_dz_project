/*
    Community Ride model,
    Driver creating his scheduled Ride 
    User can request to send delivery package through this ride
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const communityRideSchema = new Schema(
  {
    source: {
      type: Object,
      required: true,
    },
    point:{ type: Object},
    wayPoints: { type: [String]},
    destination: {
      type: Object,
      required: true,
    },
    //Ghansham Change
    driverId: { type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
     // required: true 
    },
    vehicleType: {type: String},
    // orderStatus: { type: String, required: true },
    rideStatus: { type: [String], required: true },
   
    rideStartDateTime: {type : Date, default: Date.now },
    
    metaData:{type: Object},
    rideDetails:{type: Object}
  },
  { timestamps: true }
);

const CommunityRide = mongoose.model("CommunityRide", communityRideSchema);

module.exports = { CommunityRide };
