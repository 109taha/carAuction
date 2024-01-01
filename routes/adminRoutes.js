const router = require("express").Router();
const passport = require("passport");
const adminController = require("../controllers/adminController");
const isValidPageNumber = require("../middleware/isValidPageNumber");
const catchAsync = require("../utils/catchAsync");

router.route("/register")
    .post(catchAsync(adminController.handleAdminRegistration));

router.route("/login")
    .post(catchAsync(adminController.handleAdminLogin));

router.route("/users/page/:pageNumber")
    .get(passport.authenticate("admin", { session: false }), 
         isValidPageNumber, 
         catchAsync(adminController.showUsers));

router.route("/cities/page/:pageNumber")
    .get(passport.authenticate("admin", { session: false }), 
         isValidPageNumber,
         catchAsync(adminController.showCities));

router.route("/listings/cars/page/:pageNumber")
    .get(passport.authenticate("admin", { session: false }), 
         isValidPageNumber, 
         catchAsync(adminController.showCarListings));

router.route("/listings/bikes/page/:pageNumber")
         .get(passport.authenticate("admin", { session: false }), 
              isValidPageNumber, 
              catchAsync(adminController.showBikeListings));

module.exports = router;