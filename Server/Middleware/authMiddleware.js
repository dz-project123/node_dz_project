const jwt = require("jsonwebtoken");
const { SECRETKEY } = require("../Config/serverConfig");

const verifyToken = (req, res, next) => {
  const bearerToken = req.header("Authorization");
  if (bearerToken) {
    const token = bearerToken.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
      const decoded = jwt.verify(token, SECRETKEY);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      console.log("error", error);
      res.status(401).json({ error: "Invalid token" });
    }
  }else{
    res.status(401).json({ error: "Invalid token" })
  }
};

module.exports = verifyToken;
