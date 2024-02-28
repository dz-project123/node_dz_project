const express = require("express");
const bookingRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Order } = require("../models/ordersModel");
const { Driver } = require("../models/driverModel");

// import Geohash from "latlon-geohash";
const Geohash = require("latlon-geohash")

// Signup route
bookingRouter.post("/create/", verifyToken, async (req, res) => {
  try {
    const {
      description,
      orderPrice,
      packageObj,
      orderStatus,
      receiverId,
      userId,
    } = req.body;
    // Add order entry
    let newOrder = new Order({
      description,
      orderPrice,
      packageObj,
      orderStatus,
      receiverId,
      userId,
    });
    // let order = await newOrder.save();
    // Find nearby 10 drivers - Using geohash
    let userObj = await User.findOne({ _id: userId });
    console.log("userObj", userObj);
    // Finding drivers in users geohash cell
    let drivers = await Driver.find({
      "currentLocation.geoHash": userObj.currentLocation.geoHash,
    }) || []; 
    console.log("Drivers", drivers);

    let neighbouringDrivers = [];
    if (drivers.length == 0) {
      // Check drivers in neighbouring cells
      console.log("Neigbhour hashs", Object.values(Geohash.neighbours(userObj.currentLocation.geoHash)))
      neighbouringDrivers = await Driver.find({
        "currentLocation.geoHash": {
          $in: Object.values(Geohash.neighbours(userObj.currentLocation.geoHash)),
        },
      }) || [];
    }
    console.log("neighbouringDrivers", neighbouringDrivers);
    // Send requests to all those drivers
    let allDrivers = drivers.concat(neighbouringDrivers);
    console.log("All drivers", allDrivers);
    // return response of booking
    //
    
    res.status(201).json({ message: "New booking created!", doc: doc });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = bookingRouter;