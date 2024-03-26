const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const helpDeskRouter = express.Router();
const verifyToken = require("../Middleware/authMiddleware");
const { User } = require("../models/userModel");
const { Driver } = require("../models/driverModel");
const { Order } = require("../models/ordersModel");
const { helpDeskCase } = require("../models/helpDeskCases");
const { sendEmail } = require("../utils/email");

/*
    helpdesk model
    const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
*/
helpDeskRouter.post("/create", async (req, res) => {
    try {
     
      const { orderId,userId,email,message,subject} = req.body;
      const checkExisting = helpDeskCase.find({orderId: orderId,userId: userId})

      if(checkExisting.length > 0 )
      {
        return res.status(500).json({ message: "Internal server error", error: {message: "ticket for this order may exists already or something went wrong"} });
      }
      let newCase = new helpDeskCase({
        orderId,
        userId,
        email,
        subject,
        message,
        caseStatus:"CREATED"
      });
      let doc = await newCase.save();
      sendEmail(userEmail,"[New Ticket] - Order Id - "+orderId+" "+subject,
      "Thanks for contacting us with below query, we will reach out to you shortly\n\nQuery - "+message)
      res.status(201).json({ message: "New case created!", doc: doc });
    } catch (error) {
      console.log("error",error,req.body);  
      res.status(500).json({ message: "Internal server error", error: {error:error,message: "ticket for this order may exists already or something went wrong"} });
    }
  });
  helpDeskRouter.get("/:userId", async (req, res) => {
    try {
      const  userId  = req.params.userId;
      let cases = await helpDeskCase.find({userId:userId})
      res.status(200).json({ cases: cases });
    } catch (error) {
      console.log(error);  
      res.status(500).json({ message: "Internal server error", error: error });
    }
  });
  module.exports = helpDeskRouter;