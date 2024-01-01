const nodemailer = require("nodemailer");

module.exports.sendMail = async (req, res, next) => {
  const data = req.body;
  if (!data.subject && !data.from && !data.name)
    return res.status(400).send({
      success: false,
      data: "kindly send Subject and From Email and From Name",
    });

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth:{
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: `"${data.name}" <${data.from}>`, // sender address
    to: "projectmanageratgeek@gmail.com", // list of receivers
    subject: data.subject, // Subject line
    html: data?.data, // html body
  });

  await transporter.sendMail({
    from: `"Pak Auto Zone" <projectmanageratgeek@gmail.com>`, // sender address
    to: data.from, // list of receivers
    subject: "Query Received", // Subject line
    html: "Your query has been received Pak Auto Zone team will respond within 12 to 24 hours", // html body
  });

  //   console.log(info);

  return res.status(200).send({
    success: true,
    data: "Message send successfully",
  });
};


