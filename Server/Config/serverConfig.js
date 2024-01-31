/* 
This file contains all the configs
*/ 
const PORT = process.env.PORT || 3001;
const CONNECTION_URL = process.env.CONNECTION_URL || "mongodb://localhost:27017";
const SECRETKEY = "DUNZO";
const HOST = process.env.HOST || "localhost";
const SALT = 10;

module.exports = { PORT, SECRETKEY, SALT, HOST, CONNECTION_URL };
