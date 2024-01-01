const nodemailer = require("nodemailer")

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });
    const mailOptions = {
      from: `"PakAutoZone" ${process.env.USER}`,
      to: email,
      subject: "Reset your PakAutoZone password",
      text: `We heard that you lost your PakAutoZone password. Sorry about that!
  
      But don’t worry! You can use the following Code to reset your password: ${token}
      
      If you don’t use this link within 3 hours, it will expire. To get a new password reset link, visit: https://www.pakautozone.com/forgot_password.php
  
      Thanks,
      The PakAutoZone Team`,
      
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  };
  
  module.exports = sendResetEmail