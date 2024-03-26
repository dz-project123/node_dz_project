/* 
This file contains all the configs
*/ 
const PORT = process.env.PORT || 3001;
const CONNECTION_URL = process.env.CONNECTION_URL || "mongodb://localhost:27017";
const SECRETKEY = "DUNZO";
const HOST = process.env.HOST || "localhost";
const SALT = 10;
// let passkey = ivwcuxvemcfnvrew;
const gmail_user = process.env.NODEJS_GMAIL_APP_USER || "capstoneindu@gmail.com"; // your email address
const gmail_pass = process.env.NODEJS_GMAIL_APP_PASSWORD || "ivwcuxvemcfnvrew"; // your password
module.exports = { PORT, SECRETKEY, SALT, HOST, CONNECTION_URL ,gmail_user,gmail_pass };


