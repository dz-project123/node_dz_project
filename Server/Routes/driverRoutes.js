const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const driverRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { SECRETKEY, SALT } = require("../Config/serverConfig");
const { Driver } = require("../models/driverModel");

// Signup route
driverRouter.post("/signup/", async (req, res) => {
  console.log("inside route");
  try {
    const {
      firstname,
      lastname,
      password,
      email,
      phoneNumber,
      address = {},
      license = {},
      vehichle = {},
    } = req.body;
    console.log("license", license);
    let newLicense = {
      ...license,
      expirationDate: new Date(license.expirationDate),
    };
    let newVehicle = {
      ...vehichle,
      expirationDate: new Date(license.expirationDate),
    };
    console.log("Licence details", newLicense);
    const hashedPassword = await bcrypt.hash(password, SALT);
    let newDriver = new Driver({
      firstname,
      lastname,
      password: hashedPassword,
      email,
      phoneNumber,
      address,
      license: newLicense,
      vehichle: newVehicle,
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
    const user = await Driver.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    // const passwordMatch = password === user.password;
    const passwordMatch = bcrypt.compare(user.password, password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: user._id }, SECRETKEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = driverRouter;
