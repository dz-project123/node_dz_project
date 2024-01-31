const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const bodyParser = require("body-parser");
const { PORT, } = require("./Config/serverConfig");
const userRouter = require("./Routes/userRoutes");
const driverRouter = require("./Routes/driverRoutes");

const app = express();

app.use(cors());
// Common middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// User route middleware
app.use("/api/user/", userRouter);
app.use("/api/driver/", driverRouter);

mongoose.connect("mongodb://localhost:27017/dunzo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);


app.listen(PORT, () => {
  console.log("Server started!!!");
});
