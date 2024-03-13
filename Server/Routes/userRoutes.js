const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Order } = require("../models/ordersModel");
const { Receiver } = require("../models/receiverModel");
const { SECRETKEY, SALT } = require("../Config/serverConfig");

// Testing route
userRouter.get("/greet", (req, res) => {
  res.status(200).json({ message: "Welcome to node project" });
});

// Get all users route
userRouter.get("/", verifyToken, async (req, res) => {
  try {
    let users = await User.find();
    res.status(200).json({ users: users });
  } catch (error) {
    res.status(500).json("Internal server error");
  }
});

// Signup route
userRouter.post("/signup/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      password,
      email,
      contact,
      pincode,
      address,
      currentLocation = {},
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, SALT);
    let newUser = new User({
      firstName,
      lastName,
      email,
      contact,
      pincode,
      address,
      password: hashedPassword,
      currentLocation,
    });
    let doc = await newUser.save();
    res.status(201).json({ message: "New user created!", doc: doc });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Update route
// userRouter.post("/update/", async (req, res) => {
//   try {
//     const { name, username, password, email } = req.body;
//     const hashedPassword = await bcrypt.hash(password, SALT);
//     let user = await User.find({username});
//     user.up
//     let doc = await newUser.save();
//     res.status(201).json({ message: "New user created!", doc: doc });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", error: error });
//   }
// });

// Login route
userRouter.post("/login/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: user._id }, SECRETKEY, {
      expiresIn: "1d",
    });
    const rideRates = {
      walking: 2.5,
      bicycle: 1.5,
      delivery_car: 1.27,
      pickup_truck: 1.8,
    }; ///per km cost
    res.status(200).json({ token, user, rideRates });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Pending route
// update user

userRouter.get("/get-order/:userId", async (req, res) => {
  try {
    let orders = await Order.find({
      userId: req.params.userId,
      orderStatus: "BOOKING_COMPLETED",
    })
      .populate("userId")
      .populate("receiverId")
      .populate("driverId");

    let currentOrders = await Order.find({
      userId: req.params.userId,
      orderStatus: { $nin: ["BOOKING_COMPLETED", "BOOKING_CANCELLED"] },
    })
      .populate("userId")
      .populate("receiverId")
      .populate("driverId");
    // if (orders.length <= 0) {
    //   res.status(404).json("Orders not found");
    // }
    res.status(200).json({ orders: orders, currentOrders: currentOrders });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = userRouter;
