const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const communityRideRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { CommunityRide } = require("../models/communityRide");
const { communityRideOrder } = require("../models/communityRideOrdersModel");
const Geohash = require("latlon-geohash");
const { Receiver } = require("../models/receiverModel");
const { Order } = require("../models/ordersModel");
const { User } = require("../models/userModel");
const { Driver } = require("../models/driverModel");
const { sendEmail } = require("../utils/email");
const otpGenerator = require("otp-generator");
const { SECRETKEY, SALT } = require("../Config/serverConfig");

// Get all users route
communityRideRouter.get("/ride/:driverId", verifyToken, async (req, res) => {
  try {
    let rides = await CommunityRide.find({ driverId: req.params.driverId });
    res.status(200).json({ rides: rides });
  } catch (error) {
    res.status(500).json("Internal server error");
  }
});

communityRideRouter.post("/assignOrderToRide/", async (req, res) => {
  try {
    const {
      description,
      orderPrice,
      packageObj,
      receiverId,
      userId,
      communityRide,
      orderStatus,
      metaData,
    } = req.body;
    let newCommunityOrder = new communityRideOrder({
      description,
      orderPrice,
      packageObj,
      receiverId,
      userId,
      communityRide,
      orderStatus,
      metaData,
    });
    let doc = await newCommunityOrder.save();
    res.status(201).json({ message: "New community order created!", doc: doc });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

communityRideRouter.post("/ride/", async (req, res) => {
  try {
    const {
      source,
      destination,
      point,
      driverId,
      rideStatus,
      rideStartDateTime,
      vehicleType,
      metaData
    } = req.body;
    let newCommunityRide = new CommunityRide({
      source,
      destination,
      point,
      wayPoints: [point.currentLocation.geoHash],
      driverId,
      rideStatus: [rideStatus],
      rideStartDateTime,
      vehicleType,
      metaData
    });
    let doc = await newCommunityRide.save();
    res.status(201).json({ message: "New community ride created!", doc: doc });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

communityRideRouter.post("/create/", async (req, res) => {
  try {
    const {
      description,
      orderPrice,
      packageObj,
      orderStatus,
      receiverId,
      userId,
      vehicleType,
      metaData,
      isCommunityRide,
      communityRide,
    } = req.body;
    // Add order entry
    let senderOtp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    ///

    let newOrder = new Order({
      description,
      orderPrice,
      packageObj,
      orderStatus,
      receiverId,
      userId,
      senderOtp,
      metaData,
      isCommunityRide,
      communityRide,
    });

    let order = await newOrder.save();
    // Find nearby 10 drivers - Using geohash
    let userObj = await User.findOne({ _id: userId });
    let receiverObj = await Receiver.findOne({'_id': mongoose.Types.ObjectId(receiverId)});
    let receiverHash = Geohash.encode(receiverObj.address.position.lat,receiverObj.address.position.lng,5);
    let receiverNeighbour = Object.values(Geohash.neighbours(receiverHash));
    let senderNeighbour = Object.values(Geohash.neighbours(userObj.currentLocation.geoHash));
    senderNeighbour.push(userObj.currentLocation.geoHash)
    receiverNeighbour.push(receiverHash);
    console.log('source',senderNeighbour,"destination",receiverNeighbour);
    // waypoint match
    let wayPointDestination = await CommunityRide.find({ $or:[{
        "source.currentLocation.geoHash": {
            $in: senderNeighbour,
          },
          wayPoints: {
            $in: receiverNeighbour
          }
       },
       {
        wayPoints: {
            $in: senderNeighbour
        },  
        "destination.currentLocation.geoHash":  {
            $in: receiverNeighbour,
        }
       }
    ]
      ,
      rideStatus : { $nin: ["BOOKED","EXPIRED"] } ,
      "vehicleType": vehicleType,
    }).populate("driverId");



     

    // Send requests to all those drivers
    let allDrivers = wayPointDestination


    res.status(201).json({
      message: "New booking created!",
      rides: allDrivers || [],
      orderId: order._id,
    });
  } catch (error) {
    console.log("Error while booking", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// ROUTE FOR COMMUNITY RIDE ACCEPTED BY USER
communityRideRouter.post("/user/accept-community-rider/", async (req, res) => {
  try {
    const { driverId, orderId, communityOrderId } = req.body;

    let orderInstance = await Order.findById({ _id: orderId }).populate('receiverId').populate('userId');

    let order = {};
    if (orderInstance) {
      orderInstance.orderStatus.push("BOOKING_ACCEPTED");
      orderInstance.driverId = driverId;
      await orderInstance.save();
    }

    // Add status booked of community ride
    let communityRide = await CommunityRide.findById({ _id: communityOrderId });
    console.log(communityRide.rideStatus,typeof(communityRide.rideStatus));
    // let statuses = communityRide.rideStatus;
    // statuses.push("BOOKED");
    let rideDetails = {
        price: orderInstance.metaData.communityOrderPrice,
        details:{
        'receiverAddress': orderInstance.receiverId.address.title,
        'senderAddress' : orderInstance.userId.address.title,
        'senderContact': orderInstance.userId.contact,
        'receiverContact': orderInstance.receiverId.contact,
    }
}
communityRide.rideDetails = rideDetails;
    communityRide.rideStatus.push('BOOKED');
    await communityRide.save();
    res.status(200).json({
      message: "Community ride accepted by user!",
      driverId: driverId,
      order: orderInstance,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = communityRideRouter;
