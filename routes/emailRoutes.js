const router = require("express").Router();
const passport = require("passport");
const mailController = require("../controllers/mailController");

router
  .route("/sendmail")
  .post(
    mailController.sendMail
  );


module.exports = router;
