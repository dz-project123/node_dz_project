const express = require("express");
//const jwt = require("jsonwebtoken");
//const bcrypt = require("bcrypt");
const receiverRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { receiver } = require("../models/receiverModel");
const { SECRETKEY, SALT } = require("../Config/serverConfig");

// Testing route
receiverRouter.get("/", async (req, res) => {
  try {
    let recievers = await receiver.find();
    res.status(200).json({ recievers: recievers });
  } catch (error) {
    res.status(500).json("Internal server error");
  }
});

receiverRouter.get("/:userId", async (req, res) => {
  try {
    let recieverFound = await receiver.find({ userId: req.params.userId });
    if (recieverFound.length <= 0) {
      res.status(404).json("Recievers not found");
    }
    res.status(200).json({ recievers: recieverFound });
  } catch (error) {
    res.status(500).json("Internal server error");
  }
});

receiverRouter.post("/", verifyToken, async (req, res) => {
  try {
    const { name, contact, pincode, address, building, userId } = req.body;
    let newReceiver = new receiver({
      name,
      contact,
      pincode,
      address,
      building,
      userId,
    });
    let doc = await newReceiver.save();
    res.status(201).json({ message: "New reciever created!", doc: doc });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

module.exports = receiverRouter;