

const nodemailer = require('nodemailer');
const config = require('../Config/serverConfig')

let mailTransporter =
	nodemailer.createTransport(
		{
			service: 'gmail',
			auth: {
                user: config.gmail_user, // your email address
                pass: config.gmail_pass // your password
			}
		}
	);


 const sendEmail = function(to,subject,text='',html='')
{
    
    let mailDetails = {
        from: config.gmail_user,
        to: to,
        subject: subject,
        text: text,
		html:  html
    };
    console.log(mailDetails)
    mailTransporter
	.sendMail(mailDetails,
		function (err, data) {
			if (err) {
				console.log('Error Occurs');
			} else {
				console.log('Email sent successfully');
			}
		});
}

const ride_complete_email_template = (order) =>{ return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Uber Receipt</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #f0f0f0;
      padding: 20px;
      border-radius: 5px;
      max-width: 600px;
      margin: 20px auto;
    }
    .header {
      background-color: #333;
      color: #fff;
      padding: 10px 20px;
    }
    .logo {
      font-size: 20px;
    }
    .content {
      padding: 20px;
    }
    .trip-details {
      margin-bottom: 15px;
    }
    .trip-details h3 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    .trip-details p {
      margin-top: 0;
    }
    .fare-breakdown {
      border-top: 1px solid #ccc;
      padding-top: 15px;
    }
	td{
		font-family: sans-serif monospace;
		font-size: 20px;
	}
	p{
		font-family: sans-serif monospace;
		font-size: 20px;
	}
    .fare-breakdown p {
      margin-bottom: 5px;
    }
    .fare-breakdown span {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">CanDeliver</h1>
    </div>
    <div class="content">
      <h2>Your Trip Receipt</h2>
      <div class="trip-details">
        <h3>Trip Details</h3>
		<tbody>
		<tr>
        <td>Date & Time </td> <td><span>` + new Date().toLocaleString()+`</span></td>
		</tr>
		<tr>
        <td>From </td> <td><span>`+ride.from+`</span></td>
		</tr>
		<tr>
        <td>To </td><td><span>`+ride.to+`</span></td>
		</tr>
		<tr>
        <td>Vehicle  </td><td><span>`+ ride.vehicleType +' - '+ ride.registrationNumber +`</span></td>
		</tr>
      </div>
	  </tbody>
      <div class="fare-breakdown">
        <h3>Fare Breakdown</h3>
        <p>Fare Amount: <span> $`+ ride.orderPrice+ `</span></p>
        <p>Payment Type: <span> Credit Card </span></p>
      </div>
    </div>
  </div>
</body>
</html>`}
 const VEHICAL_IMAGE_MAPPING = {
  "walking" : "Delivery Man",
  "bicycle" : "Delivery Moped",
  "delivery_car" : "Delivery Car",
  "pickup_truck" : "Delivery Truck"
}


module.exports = { sendEmail,ride_complete_email_template,VEHICAL_IMAGE_MAPPING};