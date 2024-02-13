const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const bodyParser = require("body-parser");
const { PORT, CONNECTION_URL, HOST} = require("./Config/serverConfig");
const userRouter = require("./Routes/userRoutes");
const driverRouter = require("./Routes/driverRoutes");
const receiverRouter = require("./Routes/receiverRoutes");
const app = express();

app.use(express.static("Server/public"));

app.use(cors());
// Common middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// User route middleware
app.use("/api/user/", userRouter);
app.use("/api/driver/", driverRouter);
app.use("/api/receiver/", receiverRouter);

mongoose.connect(`${CONNECTION_URL}/dunzo`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);


app.listen(PORT, HOST, () => {
  console.log("Server started!!!");
});
