const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const path = require('path');
const bodyParser = require("body-parser");
const cron = require("node-cron");

const { PORT, CONNECTION_URL, HOST} = require("./Config/serverConfig");
const userRouter = require("./Routes/userRoutes");
const driverRouter = require("./Routes/driverRoutes");
const receiverRouter = require("./Routes/receiverRoutes");
const bookingRouter = require("./Routes/bookingRoutes");
const communityRideRouter = require("./Routes/communityRides");
const helpDeskRouter = require("./Routes/helpDeskRoutes");
const {CommunityRide} = require("./models/communityRide");
const { Order } = require("./models/ordersModel");
const app = express();
var multer = require('multer');
var upload = multer();
const server = require('http').createServer(app);
// const io = require('socket.io')(server, {
//   cors: {
//     origin: '*',
//   }});
//assuming app is express Object.
//app.use("*",express.static("Server/public"));

app.use(express.static("Server/public"));
app.use('/app',function(req,res) {
  res.sendFile(path.join(__dirname+'/landing_page/index-2.html'));
});
app.use(express.static("Server/landing_page"));
/*app.use((req, res, next) => {
  req.io = io;
  return next();
});*/
app.use(cors());
// Common middlewares
app.use(bodyParser.urlencoded({ extended: true ,limit: '10mb'}));
app.use(bodyParser.json());


// for parsing multipart/form-data
app.use(upload.array());
// User route middleware
app.use("/api/user/", userRouter);
app.use("/api/driver/", driverRouter);
app.use("/api/receiver/", receiverRouter);
app.use("/api/booking/", bookingRouter);
app.use("/api/community/", communityRideRouter);
app.use("/api/cases/", helpDeskRouter);
app.use("*",function(req,res,next){ res.redirect("/")});

mongoose.connect(`${CONNECTION_URL}/dunzo`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);


server.listen(PORT, HOST, () => {
  console.log("Server started!!!");
});
function expireRides()
{
   
    console.log("scheduler ran");

}
cron.schedule("*/59 * * * * *", async function () {
  try{
  let test = await  CommunityRide.updateMany(
      {
          rideStatus: {$in:["CREATED"]},
          rideStartDateTime: {$lte: new Date().toISOString()},
          rideStatus: {$nin:["EXPIRED"]},
      },
      { $set: { rideStatus: ["CREATED","EXPIRED"] }},
  );

console.log("scheduler ran",test);
  }
 catch(error){
  console.log("scheduler ran",error);
 }

  });
  
/*io.sockets.on('connection', function (socket) {
  socket.on('join', function (data) {
    console.log("client joining ",data);
    socket.join(data.email); // We are using room of socket io
  });
});*/

