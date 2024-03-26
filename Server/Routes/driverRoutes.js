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
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: driver._id }, SECRETKEY, {
      expiresIn: "1d",
    });

    // req.io.sockets.in(driver.email).emit("new_msg", { msg: "hello" });
    //
    res.status(200).json({ token, driver });
  } catch (error) {
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
      .populate("receiverId");

    if (orders.length <= 0) {
      return res.status(404).json("Orders not found");
    }
    return res.status(200).json({ orders: orders });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json("Internal server error");
  }
});

module.exports = driverRouter;
