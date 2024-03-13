const express = require("express");
const mongoose = require("mongoose");
const bookingRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Order } = require("../models/ordersModel");
const { Driver } = require("../models/driverModel");
const otpGenerator = require("otp-generator");
// import Geohash from "latlon-geohash";
const Geohash = require("latlon-geohash");
const { Receiver } = require("../models/receiverModel");

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
      vehicleType
    } = req.body;
    // Add order entry
    //
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
    });

    let order = await newOrder.save();
    // Find nearby 10 drivers - Using geohash
    let userObj = await User.findOne({ _id: userId });
    // Finding drivers in users geohash cell
    let drivers = await Driver.find({
      "currentLocation.geoHash": userObj.currentLocation.geoHash,
      // "vehicle.type" : String(vehicleType)
    });

    console.log("drivers", drivers);

    let neighbouringDrivers = [];
    let neighb = Geohash.neighbours(userObj.currentLocation.geoHash);
    console.log("neighbours",neighb);
    if (drivers.length <= 3) {
      // Check drivers in neighbouring cells
      neighbouringDrivers = await Driver.find({
        "currentLocation.geoHash": {
          $in: Object.values(
            Geohash.neighbours(userObj.currentLocation.geoHash)
          ),
          // "vehicle.type" : String(vehicleType)
        },
      });
    }
    console.log("neighbouringDrivers", neighbouringDrivers);
    // Send requests to all those drivers
    let allDrivers = drivers.concat(neighbouringDrivers);
    console.log("All drivers", allDrivers);

    res.status(201).json({
      message: "New booking created!",
      drivers: allDrivers || [],
      orderId: order._id,
    });
  } catch (error) {
    console.log("Error while booking", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// CLIENT  -  Checks the status of request whether driver accepted the request or not.
bookingRouter.get("/user/check-orders-status", async (req, res) => {
  try {
    const { driverId, orderId } = req.query;
    let order = await Order.findById({
      _id: orderId,
    });
    console.log("driver_id ",order.driverId?._id,driverId)
    if (order && order.driverId?._id == driverId) {
      let orderStatusLen = order.orderStatus.length;
      if (order.orderStatus[orderStatusLen - 1] == "BOOKING_ACCEPTED") {
        res.status(200).json({
          message: "Order status updated",
          driverId: driverId,
          order: order,
          status: "ALREADY_ASSIGNED_TO_DRIVER",
        });
      } else {
        res.status(200).json({
          message: "New driver assigned to order",
          driverId: driverId,
          order: order,
          status: "ASSIGNED_TO_NEW_DRIVER",
        });
      }
    } else {
      // res.status(500).json({ message: "Order not found" });
      res.status(200).json({
        message: "Order must be rejected by driver",
        driverId: driverId,
        order: order,
        status: "ASSIGNED_TO_NEW_DRIVER",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Route for assigning a driver to send him a request
bookingRouter.post("/add/driver-to-order/", async (req, res) => {
  try {
    // Check first if the status of the order driver_requested. otherwise return booking already assigned to driver
    const { orderId, driverId, requestStatus } = req.body;
    let order = await Order.findById({
      _id: orderId,
    });
    if (order && order.orderStatus == "BOOKING_REQUESTED") {
      // Order exists - Update it
      // Update order with new driver
      let newOrder = await Order.findOneAndUpdate(
        { _id: order._id },
        { driverId: driverId },
        { new: true }
      );
      res.status(200).json({
        message: "New driver assigned to order",
        driverId: driverId,
        order: newOrder,
        status: "ASSIGNED_TO_NEW_DRIVER",
      });
    } else {
      // Order already assigned to a driver. Terminate driver loop on ui
      res.status(200).json({
        message: "Order status updated",
        driverId: driverId,
        order: order,
        status: "ALREADY_ASSIGNED_TO_DRIVER",
      });
    }
  } catch (error) {
    console.log("!!!!!!!!!!!!!!DRIVER ADD FAILURE ERROR!!!!!!!!!!!");
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Route for driver to accept ride
bookingRouter.post("/driver/accept-order/", async (req, res) => {
  try {
    const { driverId, request_status, orderId } = req.body;
    // let orderInstance = await Order.findOne({
    //   driverId: mongoose.Types.ObjectId(driverId),
    //   orderStatus: "BOOKING_REQUESTED",
    // });
    let orderInstance = await Order.findById({ _id: orderId });

    let order = {};
    if (orderInstance) {
      orderInstance.orderStatus.push("BOOKING_ACCEPTED");
      await orderInstance.save();
    }

    let senderDetails = await User.findById({
      _id: orderInstance.userId,
    });

    let receiverDetails = await Receiver.findById({
      _id: orderInstance.receiverId,
    });

    res.status(200).json({
      message: "Order status updated",
      driverId: driverId,
      order: orderInstance,
      senderDetails: senderDetails,
      receiverDetails: receiverDetails,
      status: "ASSIGNED_DRIVER_TO_BOOKING",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Route for driver to accept ride
bookingRouter.post("/driver/reject-order/", async (req, res) => {
  try {
    const { driverId, request_status, orderId } = req.body;
    let order = await Order.findById({ _id: orderId });
    order.driverId = null;
    await order.save();

    res.status(200).json({
      message: "Order status updated",
      driverId: driverId,
      orderId: order.orderId,
      status: "BOOKING_AVAILABLE_FOR_NEXT_DRIVER",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Route for driver to continuously poll the orders
bookingRouter.get("/driver/check-orders", async (req, res) => {
  try {
    const { driverId } = req.query;
    let order = await Order.find({
      driverId: mongoose.Types.ObjectId(driverId),
      orderStatus: { $nin: ["BOOKING_ACCEPTED", "BOOKING_COMPLETED"] },
    })
    .populate("userId")
    .populate("receiverId");;

    // Checking current rider for driver
    // REQUESTED, ACCEPTED but NOT COMPLETED
    let currentRides = await Order.find({
      driverId: mongoose.Types.ObjectId(driverId),
      orderStatus: { $nin: ["BOOKING_COMPLETED"], $in: ["BOOKING_ACCEPTED"] },
    })
      .populate("userId")
      .populate("receiverId");

    if (
      order &&
      order.length > 0 &&
      order[order.length - 1].orderStatus[
        order[order.length - 1].orderStatus.length - 1
      ] == "BOOKING_REQUESTED"
    ) {
      res.status(200).json({
        message: "New booking available",
        order: order[order.length - 1],
        showCard: true,
        currentRides: currentRides,
      });
    } else {
      res.status(200).json({
        message: "Booking not available",
        order: {},
        showCard: false,
        currentRides: currentRides,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Complete booking - Driver

// Route for driver to accept ride
bookingRouter.post("/driver/complete-booking/", async (req, res) => {
  try {
    const { driverId, orderId } = req.body;
    let order = await Order.findById({ _id: orderId });
    order.orderStatus.push("BOOKING_COMPLETED");
    await order.save();

    res.status(200).json({
      message: "Order complete",
      status: "BOOKING_COMPLETED",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Cancel Booking - No driver found
// Route for driver to accept ride
bookingRouter.post("/cancel/", async (req, res) => {
  try {
    const { orderId } = req.body;

    let order = await Order.findById({ _id: orderId });
    order.orderStatus = "BOOKING_CANCELLED";
    order.driverId = null;
    await order.save();

    res.status(200).json({
      message: "Order cancelled",
    });
  } catch (error) {
    console.log("Error while cancel booking", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// DRIVER RECEIVE PACKAGE
bookingRouter.post("/driver/accept/package/", async (req, res) => {
  try {
    const { orderId, driverOtp } = req.body;
    let order = await Order.findById({ _id: orderId });
    if (order && order.senderOtp === Number(driverOtp)) {
      res.status(200).json({ message: "otp verified", verified: true });
    } else {
      res.status(500).json({ message: "otp did not matched", verified: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = bookingRouter;