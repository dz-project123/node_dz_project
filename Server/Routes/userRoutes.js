const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Driver } = require("../models/driverModel");
const { Order } = require("../models/ordersModel");
const { Receiver } = require("../models/receiverModel");
const { sendEmail } = require("../utils/email");
const otpGenerator = require("otp-generator");
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
      creditCard = {}
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
      creditCard
    });
    let doc = await newUser.save();
    res.status(201).json({ message: "New user created!", doc: doc });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// Update route
userRouter.post("/update/", async (req, res) => {
  try {
    const { userId, firstName, lastName, address, currentLocation,creditCard } = req.body;
    console.log("called api");
    let user = await User.findById({ _id: userId });
    console.log("user", user)
    user.firstName = firstName;
    user.lastName = lastName;
    user.address = address;
    user.currentLocation = currentLocation;
    user.creditCard = creditCard;
    await user.save();
    res.status(200).json({ message: "User profile updated", doc: user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

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
      .populate("driverId")
      .sort({ _id: -1 });

    let currentOrders = await Order.find({
      userId: req.params.userId,
      orderStatus: {
        $nin: ["BOOKING_COMPLETED", "BOOKING_CANCELLED", "USER_CANCELLED"],
      },
      // Check the following filter with ghansham
      driverId: { $exists: true },
    })
      .populate("userId")
      .populate("receiverId")
      .populate("driverId");
    // if (orders.length <= 0) {
    //   res.status(404).json("Orders not found");
    // }
    let user = await User.findById({ _id: req.params.userId });
    res.status(200).json({ orders: orders, currentOrders: currentOrders,user});
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

userRouter.post("/update-password/otp", async (req, res) => {
  try {
    const { email, userType } = req.body;
    let user = {};
    if (userType == "user") user = await User.findOne({ email });
    else user = await Driver.findOne({ email });
    let otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    if (userType == "user")
      await User.updateOne(
        { email: email },
        { $set: { forgotPasswordOtp: otp } }
      );
    else
      await Driver.updateOne(
        { email: email },
        { $set: { forgotPasswordOtp: otp } }
      );

    sendEmail(
      user.email,
      "CanDeliver password update request ",
      "your otp for updating password is " + otp
    );
    res.status(200).json({ message: "otp send successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
userRouter.post("/update-password/verify-otp", async (req, res) => {
  try {
    const { email, otp, newPassword, userType } = req.body;
    let user = {};
    if (userType == "user") {
      user = await User.findOne({ email });
    } else {
      user = await Driver.findOne({ email });
    }

    if (user.forgotPasswordOtp == otp) {
      const hashedPassword = await bcrypt.hash(newPassword, SALT);
      if (userType == "user") {
        await User.updateOne(
          { email: email },
          { $set: { password: hashedPassword } }
        );
      } else {
        await Driver.updateOne(
          { email: email },
          { $set: { password: hashedPassword } }
        );
      }
      res.status(200).json({ message: "password changed successfully" });
    } else {
      res.status(500).json({ message: "incorrect otp provided" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error });
  }
});

module.exports = userRouter;
