const router = require("express").Router();
const passport = require("passport");
const userController = require("../controllers/userController");
const isValidObjectId = require("../middleware/isValidObjectId");
const {
  isValidBikeObjectIds,
  isValidCarObjectIds,
} = require("../middleware/isValidObjectIds");
const isValidPageNumber = require("../middleware/isValidPageNumber");
const catchAsync = require("../utils/catchAsync");

// Image upload
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");

router
  .route("/register")
  .post(catchAsync(userController.handleUserRegistration));

router.route("/login").post(catchAsync(userController.handleUserLogin));

router.route("/refresh").post(catchAsync(userController.issueNewAccessToken));

router.route("/cities").get(catchAsync(userController.sendAllCities));

router
  .route("/myads")
  .get(
    passport.authenticate("user", { session: false }),
    userController.getMyAds
  );

router
  .route("/myorders")
  .get(
    passport.authenticate("user", { session: false }),
    userController.getMyOrders
  );

router
  .route("/cars/features")
  .get(catchAsync(userController.sendAllCarFeatures));

router.route("/cars/brands").get(catchAsync(userController.sendAllCarBrands));

router
  .route("/listings/search/cars")
  .get(catchAsync(userController.sendAllSearchedCars));

router
  .route("/listings/search/bikes")
  .get(catchAsync(userController.sendAllSearchedBikes));

router
  .route("/listings/search/autoparts")
  .get(catchAsync(userController.sendAllSearchedAutoParts));

router
  .route("/cars/brands/:id/models")
  .get(isValidObjectId, catchAsync(userController.sendAllCarModels));

router
  .route("/autoparts/cat")
  .get(catchAsync(userController.sendAllAutoPartCat));

router
  .route("/autoparts/cat/:category/sub")
  .get(catchAsync(userController.sendAllAutoPartSubCat));

router
  .route("/listings/autopart/new")
  .post(
    passport.authenticate("user", { session: false }),
    upload.array("images", 5),
    userController.createNewAutoPartListing
  );

router
  .route("/listings/autopart/order/new")
  .post(
    passport.authenticate("user", { session: false }),
    userController.createNewOrder
  );

router
  .route("/bikes/features")
  .get(catchAsync(userController.sendAllBikeFeatures));

router.route("/bikes/brands").get(catchAsync(userController.sendAllBikeBrands));

router
  .route("/bikes/brands/:id/models")
  .get(isValidObjectId, catchAsync(userController.sendAllBikeModels));

router
  .route("/listings/cars/page/")
  .get((req, res) => res.redirect("/listings/cars/page/1"));

router
  .route("/listings/cars/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showCarListings));

router
  .route("/listings/autoparts")
  .get(catchAsync(userController.showAutoPartListings));

router
  .route("/listings/cars/b/:brandid/m/:modelid/page/:pageNumber")
  .get(
    isValidPageNumber,
    catchAsync(userController.showCarListingsByBrandModel)
  );

router
  .route("/listings/cars/new/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showNewCarListings));

router
  .route("/listings/cars/used/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showUsedCarListings));

router
  .route("/listings/cars/:link_id")
  .get(catchAsync(userController.showIndividualCarListing));

router
  .route("/listings/autoparts/:id")
  .get(catchAsync(userController.showIndividualAutoPartListing));

router
  .route("/listings/cars/compare/:carid1/:carid2")
  .get(isValidCarObjectIds, catchAsync(userController.compareIndividualCar));

router
  .route("/listings/cars/new")
  .post(
    passport.authenticate("user", { session: false }),
    upload.array("images", 7),
    userController.createNewCarListing
  );

router
  .route("/listings/bikes/page/")
  .get((req, res) => res.redirect("/listings/bikes/page/1"));

router
  .route("/listings/bikes/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showBikeListings));

router
  .route("/listings/bikes/new/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showNewBikeListings));

router
  .route("/listings/bikes/used/:location/page/:pageNumber")
  .get(isValidPageNumber, catchAsync(userController.showUsedBikeListings));

router
  .route("/listings/bikes/b/:brandid/m/:modelid/page/:pageNumber")
  .get(
    isValidPageNumber,
    catchAsync(userController.showBikeListingsByBrandModel)
  );

router
  .route("/listings/bikes/:link_id")
  .get(catchAsync(userController.showIndividualBikeListing));

router
  .route("/listings/bikes/compare/:bikeid1/:bikeid2")
  .get(isValidBikeObjectIds, catchAsync(userController.compareIndividualBike));

router
  .route("/listings/bikes/new")
  .post(
    passport.authenticate("user", { session: false }),
    upload.array("images", 7),
    userController.createNewBikeListing
  );

router
  .route("/chat/new")
  .post(
    passport.authenticate("user", { session: false }),
    userController.createNewChat
  );

router
  .route("/chatlist")
  .get(
    passport.authenticate("user", { session: false }),
    userController.chatList
  );

router
  .route("/checkfcm")
  .post(
    passport.authenticate("user", { session: false }),
    userController.checkFcm
  );

router
  .route("/sendnoti")
  .post(
    passport.authenticate("user", { session: false }),
    userController.sendNoti
  );

router.route("/forgotpass").post(userController.forgotPassword);

router.route("/update/:id").put(userController.handleUserUpdate);

router
  .route("/listings/cars/update/:Id")
  .post(upload.array("images", 7), userController.updateCarListing);

router
  .route("/listings/bike/update/:Id")
  .post(upload.array("images", 7), userController.updateBikeListing);

router
  .route("/listings/parts/update/:Id")
  .post(upload.array("images", 7), userController.updatePartListing);

router
  .route("/new/bike/model")
  .post(
    passport.authenticate("admin", { session: false }),
    userController.createBikeModel
  );

router.route("/bike/model/:pageNumber").get(userController.sendBikeModel);

router
  .route("/new/car/model")
  .post(
    passport.authenticate("admin", { session: false }),
    userController.createCarModel
  );

router.route("/car/model/:pageNumber").get(userController.sendCarModel);

router
  .route("/new/car/brand")
  .post(
    passport.authenticate("admin", { session: false }),
    upload.array("images", 7),
    userController.createCarBrand
  );

router
  .route("/new/bike/brand")
  .post(
    passport.authenticate("admin", { session: false }),
    upload.array("images", 7),
    userController.createBikeBrand
  );

router
  .route("/new/bike/feature")
  .post(
    passport.authenticate("admin", { session: false }),
    userController.createBikeFeature
  );

router
  .route("/new/car/feature")
  .post(
    passport.authenticate("admin", { session: false }),
    userController.createCarFeature
  );

module.exports = router;
