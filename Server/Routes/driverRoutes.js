const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const driverRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { SECRETKEY, SALT } = require("../Config/serverConfig");
const { Driver } = require("../models/driverModel");
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
    // const passwordMatch = password === user.password;
    const passwordMatch = bcrypt.compare(driver.password, password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: driver._id }, SECRETKEY, {
      expiresIn: "1d",
    });

    req.io.sockets.in(driver.email).emit('new_msg', {msg: 'hello'});
    //
    res.status(200).json({ token, driver });
  } catch (error) {
    console.log("error",error);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = driverRouter;
