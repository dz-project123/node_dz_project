const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const path = require('path');
const bodyParser = require("body-parser");
const { PORT, CONNECTION_URL, HOST} = require("./Config/serverConfig");
const userRouter = require("./Routes/userRoutes");
const driverRouter = require("./Routes/driverRoutes");
const receiverRouter = require("./Routes/receiverRoutes");
const bookingRouter = require("./Routes/bookingRoutes");

const app = express();
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// User route middleware
app.use("/api/user/", userRouter);
app.use("/api/driver/", driverRouter);
app.use("/api/receiver/", receiverRouter);
app.use("/api/booking/", bookingRouter);
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

/*io.sockets.on('connection', function (socket) {
  socket.on('join', function (data) {
    console.log("client joining ",data);
    socket.join(data.email); // We are using room of socket io
  });
});*/

