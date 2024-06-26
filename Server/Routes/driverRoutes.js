const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const driverRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { SECRETKEY, SALT } = require("../Config/serverConfig");
const { Driver } = require("../models/driverModel");
const { Order } = require("../models/ordersModel");

// Signup route
driverRouter.post("/signup/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      password,
      email,
      contact,
      address = {},
      bankDetails,
      license = {
        number: "",
        expirationDate: "",
      },
      vehicle = {
        type: "",
        registrationNumber: "",
      },
      currentLocation = {
        lat: "",
        lng: "",
        geoHash: "",
      },
    } = req.body;
    console.log("REQUEST BODY", req.body);

    const hashedPassword = await bcrypt.hash(password, SALT);
    let newDriver = new Driver({
      firstName,
      lastName,
      password: hashedPassword,
      email,
      contact,
      address,
      license,
      vehicle,
      currentLocation,
      bankDetails
    });
    let doc = await newDriver.save();
    res.status(201).json({ messsage: "New driver added successfully", doc });
  } catch (error) {
    console.log("catched error", error);
    res.status(500).json({ messsage: "Internal server error", error: error });
  }
});

// Login route
driverRouter.post("/login/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const passwordMatch = await bcrypt.compare(password,driver.password);
    console.log("driver password matching",passwordMatch,driver.password,password)
    driver.isOnline = true;
    await driver.save();
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: driver._id }, SECRETKEY, {
      expiresIn: "1d",
    });
    

    // req.io.sockets.in(driver.email).emit("new_msg", { msg: "hello" });
    //
    res.status(200).json({ token, driver  });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Login failed", error: error });
  }
});

// GET DRIVER PREVIOUS ORDER DETAILS ROUTE
driverRouter.get("/get-order/:driverId", async (req, res) => {
  try {
    let orders = await Order.find({
      driverId: mongoose.Types.ObjectId(req.params.driverId),
      orderStatus: "BOOKING_COMPLETED",
    })
      .populate("userId")
      .populate("receiverId")
      .populate("driverId").sort({_id:-1});

    if (orders.length <= 0) {
      return res.status(404).json("Orders not found");
    }
    const driver = await Driver.findOne({ _id: req.params.driverId });
    return res.status(200).json({ orders: orders,driver});
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json("Internal server error");
  }
});

driverRouter.get("/offline/:driverId", async (req, res) => {
  try {
    const {isOnline=true} = req.query;
    const driver = await Driver.findOneAndUpdate({_id:req.params.driverId}, {isOnline: isOnline}, {
      new: true
    });
    console.log(driver)
    return res.status(200).json({driver});
  } catch (error) {
    console.log("Error", error);
    return res.status(200).json("Internal server error");
  }
});

function getDriverEarningCommunity(driverId)
{
  let monthly = db.orders.aggregate([ 
    { $match: 
      { 
        driverId: ObjectId(driverId) ,
        isCommunityRide: true
      }  
    }, 
    {
      $group: 
      {  _id: 
        { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } 
        },         
        total_cost_month: { $sum: "$orderPrice" }     
      } 
    } ]);
  let yearly = db.orders.aggregate([ 
    { $match: 
      { 
        driverId: ObjectId(driverId),
        isCommunityRide: true 
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
    let weekly = db.orders.aggregate([ 
      { $match: 
        { 
          driverId: ObjectId(driverId),
          isCommunityRide: true,
        }  
      }, 
      {
        $group: 
        {  _id: 
          { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } , week: {$week: "$createdAt"}
          },         
          total_cost_weekly: { $sum: "$orderPrice" }     
        } 
      } ]);

      return {
        month: monthly.total_cost_month,
        yearly: yearly.total_cost_yearly,
        weekly: weekly.total_cost_weekly
      }
}
module.exports = driverRouter;
