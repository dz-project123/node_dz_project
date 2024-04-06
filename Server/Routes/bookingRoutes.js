const express = require("express");
const mongoose = require("mongoose");
const bookingRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Order } = require("../models/ordersModel");
const { Driver } = require("../models/driverModel");
const otpGenerator = require("otp-generator");
const moment = require('moment');
// import Geohash from "latlon-geohash";
const Geohash = require("latlon-geohash");
const { Receiver } = require("../models/receiverModel");
const { CommunityRide } = require("../models/communityRide");
const { sendEmail,ride_complete_email_template,VEHICAL_IMAGE_MAPPING } = require("../utils/email");

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
      vehicleType,
      metaData
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
      metaData
    });

    let order = await newOrder.save();
    // Find nearby 10 drivers - Using geohash
    let userObj = await User.findOne({ _id: userId });
    // Finding drivers in users geohash cell
    let drivers = await Driver.find({
      'currentLocation.geoHash': userObj.currentLocation.geoHash,
      'vehicle.type' : vehicleType
    });

    console.log("drivers", drivers);
    let neighbouringDrivers = [];
    let neighb = Geohash.neighbours(userObj.currentLocation.geoHash);
    console.log("neighbours",neighb);
    if (drivers.length <= 3) {
      // Check drivers in neighbouring cells
      neighbouringDrivers = await Driver.find({
        'currentLocation.geoHash': {
          $in: Object.values(
            Geohash.neighbours(userObj.currentLocation.geoHash)
          )
        },
        'vehicle.type' : vehicleType  
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
      orderStatus: { $nin: ["BOOKING_ACCEPTED", "BOOKING_COMPLETED","USER_CANCELLED"] },
    })
    .populate("userId")
    .populate("receiverId");;

    // Checking current rider for driver
    // REQUESTED, ACCEPTED but NOT COMPLETED
    let currentRides = await Order.find({
      driverId: mongoose.Types.ObjectId(driverId),
      orderStatus: { $nin: ["BOOKING_COMPLETED","USER_CANCELLED"], $in: ["BOOKING_ACCEPTED"] },
    })
      .populate("userId")
      .populate("receiverId");
      let earnings = await getDriverEarning(driverId);
      let communityEarnings = await getDriverEarningCommunity(driverId);
      const driver = await Driver.findOne({ _id:driverId });
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
        earnings,
        communityEarnings,
        driver
      });
    } else {
      res.status(200).json({
        message: "Booking not available",
        order: {},
        showCard: false,
        currentRides: currentRides,
        earnings,
        communityEarnings,
        driver
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
    let order = await Order.findById({ _id: orderId }).populate('userId').populate('driverId').populate('receiverId');
    order.orderStatus.push("BOOKING_COMPLETED");
    
    ride = {
      orderId : order._id,
      from : order.receiverId.address.title,
      to : order.userId.address.title,
      registrationNumber: order.driverId.vehicle.registrationNumber,
      vehicleType: VEHICAL_IMAGE_MAPPING[order.driverId.vehicle.type] || order.driverId.vehicle.type,
      orderPrice: order.isCommunityRide?order.metaData.communityOrderPrice:order.orderPrice
    }
    console.log("to email ",order.userId.email,new Date().toLocaleDateString())
    await order.save();
    let date = new Date().toLocaleDateString()
    sendEmail(
      order.userId.email,
      "Your Package Delivery with CanDeliver - "+ date ,'',
      ride_complete_email_template(ride)
    );
    
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
    if(order.isCommunityRide == true)
    {
      order.orderStatus = "BOOKING_CANCELLED";
    } 
    else 
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
      order.isVerified = true;
      order.orderStatus.push("OTP_VERIFIED");
      await order.save();
      res.status(200).json({ message: "otp verified", verified: true,order });
    } else {
      res.status(500).json({ message: "otp did not matched", verified: false,order });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
//// update rating
bookingRouter.get("/orders/rateDriver", async (req, res) => {
  let driver = {};
  try {
    const { orderId,rating } = req.query;
    let order = await Order.findById({
      _id: orderId,
    });
    order.driverRating = parseInt(rating);
    order.isUserRatingAvailable = true;
    await order.save();
    let driver = await Driver.findById({
      _id: order.driverId
    });
    driver.ratingSum = (driver?.ratingSum || 0) + parseInt(rating);
    driver.ratingCount = (driver?.ratingCount || 0) + 1;
    await driver.save();
    res.status(200).json({
      message: "driver rating updated",
      order: order,
    });
    
  } catch (error) {
    console.log(error,driver)
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
bookingRouter.get("/orders/rateUser", async (req, res) => {
  let user = {}
  try {
    const { orderId,rating } = req.query;
    let order = await Order.findById({
      _id: orderId,
    });
    order.userRating = parseInt(rating);
    order.isDriverRatingAvailable = true;
    await order.save();
    let user = await User.findById({
      _id: order.userId
    });
    user.ratingSum = (user?.ratingSum || 0) + parseInt(rating);
    user.ratingCount = (user?.ratingCount || 0) + 1;
    await user.save();
    res.status(200).json({
      message: "user rating updated",
      order: order,
    });
    
  } catch (error) {
    console.log(error,user)
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
bookingRouter.get("/update/", async (req, res) => {
  try {
    const { orderId,field,value } = req.query;

    let order = await Order.findById({ _id: orderId });
    order[field] = value 
    await order.save();

    res.status(200).json({
      message: "Order updated",
    });
  } catch (error) {
    console.log("Error while updating booking", error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
const getDriverEarning =async function(driverId)
{
const startOfCurrentMonth = new Date();
startOfCurrentMonth.setDate(1);
  let monthly = await Order.aggregate([ 
    { $match: 
      { 
        driverId: mongoose.Types.ObjectId(driverId) ,
        orderStatus: {$in: ["BOOKING_COMPLETED"]},
        isCommunityRide: false,
        createdAt: {
          $gte: startOfCurrentMonth,
      }

      }  
    }, 
    {
      $group: 
      {  _id: 
        { year: { $year: "$createdAt" }, month: { $month: "$updatedAt" } 
        },         
        total_cost_month: { $sum: "$orderPrice" }     
      } 
    } ]);
  let yearly = await Order.aggregate([ 
    { $match: 
      { 
        driverId: mongoose.Types.ObjectId(driverId),
        orderStatus: {$in: ["BOOKING_COMPLETED"]},
        isCommunityRide: false, 
      }  
    }, 
    {
      $group: 
      {  _id: 
        { year: { $year: "$createdAt" },
        },         
        total_cost_yearly: { $sum: "$orderPrice" }     
      } 
    } ]);
    let weekly = await Order.aggregate([ 
      { $match: 
        { 
          driverId: mongoose.Types.ObjectId(driverId),
          orderStatus: {$in: ["BOOKING_COMPLETED"]},
          isCommunityRide: false,
          createdAt:{
            $gte: startOfWeek(new Date())
          }  
        }  
      }, 
      {
        $group: 
        {  _id: 
          { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } , week: {$week: "$updatedAt"}
          },         
          total_cost_weekly: { $sum: "$orderPrice" }     
        } 
      } ]);
      
      return {
        month: monthly[0]?.total_cost_month,
        yearly: yearly[0]?.total_cost_yearly,
        weekly: weekly[0]?.total_cost_weekly
      }
      
}

const getDriverEarningCommunity =async function(driverId)
{
  const startOfCurrentMonth = new Date();
  startOfCurrentMonth.setDate(1);
  let monthly = await Order.aggregate([ 
    { $match: 
      { 
        driverId: mongoose.Types.ObjectId(driverId) ,
        orderStatus: {$in: ["BOOKING_COMPLETED"]},
        isCommunityRide: true,
        createdAt: {
          $gte: startOfCurrentMonth,
      }
      }  
    }, 
    {
      $group: 
      {  _id: 
        { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } 
        },         
        total_cost_month: { $sum: "$metaData.communityOrderPrice" }     
      } 
    } ]);
  let yearly = await Order.aggregate([ 
    { $match: 
      { 
        driverId: mongoose.Types.ObjectId(driverId),
        orderStatus: {$in: ["BOOKING_COMPLETED"]},
        isCommunityRide: true, 
      }  
    }, 
    {
      $group: 
      {  _id: 
        { year: { $year: "$createdAt" },
        },         
        total_cost_yearly: { $sum: "$metaData.communityOrderPrice" }     
      } 
    } ]);
    let weekly = await Order.aggregate([ 
      { $match: 
        { 
          driverId: mongoose.Types.ObjectId(driverId),
          orderStatus: {$in: ["BOOKING_COMPLETED"]},
          isCommunityRide: true,  
          createdAt:{
            $gte: startOfWeek(new Date())
          }  
        }  
      }, 
      {
        $group: 
        {  _id: 
          { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } , week: {$week: "$createdAt"}
          },         
          total_cost_weekly: { $sum: "$metaData.communityOrderPrice" }     
        } 
      } ]);
      console.log(monthly,{
        month: monthly[0]?.total_cost_month,
        yearly: yearly[0]?.total_cost_yearly,
        weekly: weekly[0]?.total_cost_weekly
      })
      return {
        month: monthly[0]?.total_cost_month,
        yearly: yearly[0]?.total_cost_yearly,
        weekly: weekly[0]?.total_cost_weekly
      }
      
}
function startOfWeek(date)
{
  // Calculate the difference between the date's day of the month and its day of the week
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

  // Set the date to the start of the week by setting it to the calculated difference
  return new Date(date.setDate(diff));
}

module.exports = bookingRouter;