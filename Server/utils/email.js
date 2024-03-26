

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


 const sendEmail = function(to,subject,text)
{
    
    let mailDetails = {
        from: config.gmail_user,
        to: to,
        subject: subject,
        text: text
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



module.exports = { sendEmail};