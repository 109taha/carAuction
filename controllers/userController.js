const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
var FCM = require("fcm-node");
const { v4: uuidv4 } = require("uuid");

// Models
const City = require("../models/City");
const User = require("../models/User");
const Match = require("../models/Match");
const Order = require("../models/Order");
const CarBrand = require("../models/CarBrand");
const CarModel = require("../models/CarModel");
const BikeBrand = require("../models/BikeBrand");
const BikeModel = require("../models/BikeModel");
const CarListing = require("../models/CarListing");
const BikeListing = require("../models/BikeListing");
const sendResetEmail = require("../middleware/mailer");
const RefreshToken = require("../models/RefreshToken");
const AutoPartsListing = require("../models/AutoPartsListing");
const AutoPartCategory = require("../models/AutoPartCategory");
const AutoPartSubCategory = require("../models/AutoPartSubCategory");

// Joi Schemas
const userSchema = require("../utils/schemas/userSchema");
const modelCarSchema = require("../utils/schemas/modelCarSchema");
const modelBikeSchema = require("../utils/schemas/modelBikeSchema");
const autoPartSchema = require("../utils/schemas/autoPartSchema");
const carListingSchema = require("../utils/schemas/carListingSchema");
const bikeListingSchema = require("../utils/schemas/bikeListingSchema");

// Utils and constants
const {
  genPasswordAndHash,
  validPassword,
} = require("../utils/handlePasswords");
const {
  issueUserRefreshToken,
  issueUserAccessToken,
} = require("../utils/userJwts");
const CarFeature = require("../models/CarFeature");
const BikeFeature = require("../models/BikeFeature");

// Cloudinary
const cloudinary = require("../config/cloudinary");
const { truncate } = require("fs/promises");
const brandCarSchema = require("../utils/schemas/brandCarSchema");
const brandBikeSchema = require("../utils/schemas/brandBikeSchema");
const featureBikeSchema = require("../utils/schemas/bikeFeature");
const featureCarSchema = require("../utils/schemas/carFeature");
const CarBidding = require("../models/CarBiddingListing");
const CarSize = require("../models/carSize");
const sizeCarSchema = require("../utils/schemas/carSizeSchema");

const USER_REFRESH_PUB_KEY =
  process.env.U_REFRESH_PUB_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/user/refreshToken_public_key.pem"),
    {
      encoding: "utf8",
    }
  );

var serverKey = process.env.SERVER_KEY;
var fcm = new FCM(serverKey);

// Controller logic starts here

module.exports.handleUserRegistration = async (req, res, next) => {
  const result = userSchema.validate(req.body, {
    abortEarly: false,
  });
  console.log(result.value.email);
  const email = result.value.email;
  const user = await User.findOne({ email });
  if (user)
    return res
      .status(400)
      .send({ success: false, message: "This email is already used" });

  if (result.error) {
    const x = result.error.details.map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: x,
    });
  }

  const { hash, salt } = genPasswordAndHash(result.value.password);
  delete result.value.password;
  const userData = {
    ...result.value,
    hash,
    salt,
  };
  let newUser = new User(userData);

  newUser = await newUser.save();

  return res.json({
    success: true,
    message: `User registration successful`,
    user: newUser,
  });
};

module.exports.handleUserLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const invalidResponse = {
    success: false,
    message: "Email or password is invalid",
  };
  const user = await User.findOne({
    email,
  }).select("+salt +hash");
  if (!user) return res.status(401).json(invalidResponse);

  const isValidPassword = validPassword(password, user.hash, user.salt);
  if (!isValidPassword) return res.status(401).json(invalidResponse);

  const refreshTokenObj = issueUserRefreshToken(user);
  const accessTokenObj = issueUserAccessToken(user);

  const refreshToken = new RefreshToken({
    user,
    token: refreshTokenObj.refreshToken,
  });
  await refreshToken.save();

  let refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 90);

  res.cookie("rt", refreshTokenObj.refreshToken, {
    httpOnly: true,
    path: "/user/refresh",
    expires: refreshExpiry,
  });
  return res.status(200).json({
    success: true,
    accessToken: accessTokenObj.accessToken,
    expires: accessTokenObj.expiresIn,
    user: user,
  });
};

module.exports.issueNewAccessToken = async (req, res, next) => {
  const { rt } = req.cookies;
  console.log(req.cookies);
  const foundRefreshToken = await RefreshToken.findOne({
    token: rt,
  });
  if (!foundRefreshToken)
    return res.status(402).json({
      success: false,
      message: "Your refresh token is invalid",
    });

  const actualRT = rt.split(" ")[1];

  const decodedRefreshToken = jwt.verify(
    actualRT,
    USER_REFRESH_PUB_KEY,
    (err, decoded) => {
      if (err?.name === "TokenExpiredError") {
        return {
          success: false,
          message: "Your token has expired",
        };
      }

      if (err?.name === "JsonWebTokenError") {
        return {
          success: false,
          message: "Invalid token provided",
        };
      }

      if (!err) {
        return {
          success: true,
          token: decoded,
        };
      }
    }
  );

  if (!decodedRefreshToken.success)
    return res.status(402).json({
      success: false,
      message: decodedRefreshToken.message,
    });

  const user = await User.findById(decodedRefreshToken.token._id);
  const accessTokenObj = issueUserAccessToken(user);
  return res.status(200).json({
    success: true,
    accessToken: accessTokenObj.accessToken,
    expires: accessTokenObj.expiresIn,
  });
};

module.exports.sendAllCities = async (req, res, next) => {
  const cities = await City.find();
  return res.json({
    success: true,
    data: cities,
  });
};

module.exports.sendAllAutoPartCat = async (req, res, next) => {
  const categories = await AutoPartCategory.find();
  return res.json({
    success: true,
    data: categories,
  });
};

module.exports.sendAllAutoPartSubCat = async (req, res, next) => {
  const { category } = req.params;

  const categories = await AutoPartSubCategory.find({
    category: category,
  }).populate({
    path: "category",
  });
  return res.json({
    success: true,
    data: categories,
  });
};

module.exports.sendAllCarFeatures = async (req, res, next) => {
  const allFeatures = await CarFeature.find();
  res.json({
    success: true,
    data: allFeatures,
  });
};

module.exports.sendAllCarBrands = async (req, res, next) => {
  const allBrands = await CarBrand.find();
  res.json({
    success: true,
    data: allBrands,
  });
};

module.exports.sendAllCarModels = async (req, res, next) => {
  const { id } = req.params;
  const allModels = await CarModel.find({
    brand: id,
  });
  res.json({
    success: true,
    data: allModels,
  });
};

module.exports.sendAllBikeFeatures = async (req, res, next) => {
  const allFeatures = await BikeFeature.find();
  res.json({
    success: true,
    data: allFeatures,
  });
};

module.exports.sendAllBikeBrands = async (req, res, next) => {
  const allBrands = await BikeBrand.find();
  res.json({
    success: true,
    data: allBrands,
  });
};

module.exports.sendAllBikeModels = async (req, res, next) => {
  const { id } = req.params;
  const allModels = await BikeModel.find({
    brand: id,
  });
  res.json({
    success: true,
    data: allModels,
  });
};

module.exports.showCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const location = req.params.location;
  const skipping = (pageNumber - 1) * 20;

  const listings =
    location == "all"
      ? await CarListing.find({
          // status: "active",
          type: "normal",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await CarListing.find({
          // status: "active",
          type: "normal",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.sendAllSearchedCars = async (req, res, next) => {
  let {
    title,
    features,
    location,
    brand,
    model,
    model_yearlt,
    model_yeargt,
    condition,
    distance_driven,
    fuel_type,
    engine_capacity,
    transmission_type,
    assembly,
    pricelt,
    pricegt,
    body_color,
  } = req.query;
  const queries = Object.fromEntries(
    Object.entries({
      title,
      features,
      location,
      brand,
      model,
      model_yearlt,
      model_yeargt,
      condition,
      distance_driven,
      fuel_type,
      engine_capacity,
      transmission_type,
      assembly,
      pricelt,
      pricegt,
      body_color,
    }).filter(([_, v]) => v != null && v != "" && v != undefined)
  );

  if (queries.title) {
    queries.title = { $regex: queries.title, $options: "i" };
  }
  if (queries.pricelt || queries.pricegt) {
    queries.price = {};
    if (queries.pricegt) {
      queries.price.$gte = parseFloat(queries.pricegt);
      delete queries.pricegt;
    }
    if (queries.pricelt) {
      queries.price.$lte = parseFloat(queries.pricelt);
      delete queries.pricelt;
    }
  }
  if (queries.model_yearlt || queries.model_yeargt) {
    queries.model_year = {};
    if (queries.model_yeargt) {
      queries.model_year.$gte = parseInt(queries.model_yeargt);
      delete queries.model_yeargt;
    }
    if (queries.model_yearlt) {
      queries.model_year.$lte = parseInt(queries.model_yearlt);
      delete queries.model_yearlt;
    }
  }
  if (queries.features) {
    let features = queries.features.split("-");
    delete queries.features;
    queries.features = {};
    queries.features.$in = features;
  }
  if (queries.distance_driven) {
    queries.distance_driven = { $lte: parseInt(queries.distance_driven) };
  }
  if (queries.engine_capacity) {
    queries.engine_capacity = { $lte: parseInt(queries.engine_capacity) };
  }

  const listings = await CarListing.find({
    // status: "active",
    type: "normal",
    $and: [queries],
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "registration_city",
    });

  return res.json({
    success: true,
    // data: queryArray,
    data: listings,
  });
};

module.exports.showAutoPartListings = async (req, res, next) => {
  const listings = await AutoPartsListing.find({
    status: "active",
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "category",
    })
    .populate({
      path: "sub_category",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    });
  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.sendAllSearchedAutoParts = async (req, res, next) => {
  let { title, category, sub_category, brand, model, pricelt, pricegt } =
    req.query;
  const queries = Object.fromEntries(
    Object.entries({
      title,
      category,
      sub_category,
      brand,
      model,
      pricelt,
      pricegt,
    }).filter(([_, v]) => v != null && v != "" && v != undefined)
  );

  if (queries.title) {
    queries.title = { $regex: queries.title, $options: "i" };
  }
  if (queries.pricelt || queries.pricegt) {
    queries.price = {};
    if (queries.pricegt) {
      queries.price.$gte = parseFloat(queries.pricegt);
      delete queries.pricegt;
    }
    if (queries.pricelt) {
      queries.price.$lte = parseFloat(queries.pricelt);
      delete queries.pricelt;
    }
  }

  const listings = await AutoPartsListing.find({
    status: "active",
    $and: [queries],
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "category",
    })
    .populate({
      path: "sub_category",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    });
  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showCarListingsByBrandModel = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const brandId = req.params.brandid;
  const modelId = req.params.modelid;
  const skipping = (pageNumber - 1) * 20;

  const listings = await CarListing.find({
    // status: "awaiting approval",
    type: "normal",
    brand: brandId,
    model: modelId,
  })
    .sort({
      created_on: -1,
    })
    .skip(skipping)
    .limit(20)
    .populate({
      path: "location",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "registration_city",
    });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showNewCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const location = req.params.location;
  const skipping = (pageNumber - 1) * 20;
  const listings =
    location == "all"
      ? await CarListing.find({
          // status: "active",
          type: "normal",
          condition: "new",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await CarListing.find({
          // status: "active",
          type: "normal",
          condition: "new",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showUsedCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const location = req.params.location;
  const skipping = (pageNumber - 1) * 20;
  const listings =
    location == "all"
      ? await CarListing.find({
          type: "normal",
          // status: "active",
          condition: "used",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await CarListing.find({
          // status: "active",
          type: "normal",
          condition: "used",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showAccidentCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const location = req.params.location;
  const skipping = (pageNumber - 1) * 20;
  const listings =
    location == "all"
      ? await CarListing.find({
          // status: "active",
          type: "normal",
          condition: "accidental",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
      : await CarListing.find({
          // status: "active",
          type: "normal",
          condition: "accidental",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showBikeListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const skipping = (pageNumber - 1) * 20;
  const location = req.params.location;
  const listings =
    location == "all"
      ? await BikeListing.find({
          // status: "active",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await BikeListing.find({
          status: "active",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.sendAllSearchedBikes = async (req, res, next) => {
  let {
    title,
    features,
    location,
    brand,
    model,
    model_yearlt,
    model_yeargt,
    condition,
    distance_driven,
    engine_type,
    pricelt,
    pricegt,
  } = req.query;
  const queries = Object.fromEntries(
    Object.entries({
      title,
      features,
      location,
      brand,
      model,
      model_yearlt,
      model_yeargt,
      condition,
      distance_driven,
      engine_type,
      pricelt,
      pricegt,
    }).filter(([_, v]) => v != null && v != "" && v != undefined)
  );

  if (queries.title) {
    queries.title = { $regex: queries.title, $options: "i" };
  }
  if (queries.pricelt || queries.pricegt) {
    queries.price = {};
    if (queries.pricegt) {
      queries.price.$gte = parseFloat(queries.pricegt);
      delete queries.pricegt;
    }
    if (queries.pricelt) {
      queries.price.$lte = parseFloat(queries.pricelt);
      delete queries.pricelt;
    }
  }
  if (queries.model_yearlt || queries.model_yeargt) {
    queries.model_year = {};
    if (queries.model_yeargt) {
      queries.model_year.$gte = parseInt(queries.model_yeargt);
      delete queries.model_yeargt;
    }
    if (queries.model_yearlt) {
      queries.model_year.$lte = parseInt(queries.model_yearlt);
      delete queries.model_yearlt;
    }
  }
  if (queries.features) {
    let features = queries.features.split("-");
    delete queries.features;
    queries.features = {};
    queries.features.$in = features;
  }
  if (queries.distance_driven) {
    queries.distance_driven = { $lte: parseInt(queries.distance_driven) };
  }
  const listings = await BikeListing.find({
    status: "active",
    $and: [queries],
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "registration_city",
    });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showBikeListingsByBrandModel = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const skipping = (pageNumber - 1) * 20;
  const brandId = req.params.brandid;
  const modelId = req.params.modelid;

  const listings = await BikeListing.find({
    status: "active",
    brand: brandId,
    model: modelId,
  })
    .sort({
      created_on: -1,
    })
    .skip(skipping)
    .limit(20)
    .populate({
      path: "location",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "registration_city",
    });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showNewBikeListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const skipping = (pageNumber - 1) * 20;
  const location = req.params.location;
  const listings =
    location == "all"
      ? await BikeListing.find({
          status: "active",
          condition: "new",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await BikeListing.find({
          status: "active",
          condition: "new",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showUsedBikeListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const skipping = (pageNumber - 1) * 20;
  const location = req.params.location;
  const listings =
    location == "all"
      ? await BikeListing.find({
          status: "active",
          condition: "used",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await BikeListing.find({
          status: "active",
          condition: "used",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};

module.exports.showIndividualCarListing = async (req, res, next) => {
  const { link_id } = req.params;
  const foundCarListing = await CarListing.findOneAndUpdate(
    {
      link_id,
      // status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });
  console.log(link_id);
  if (!foundCarListing)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  return res.json({
    success: true,
    data: foundCarListing,
  });
};

module.exports.showIndividualAutoPartListing = async (req, res, next) => {
  const { id } = req.params;
  const foundAutoPartListing = await AutoPartsListing.findOneAndUpdate(
    {
      _id: id,
      status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "category",
    })
    .populate({
      path: "sub_category",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    });

  if (!foundAutoPartListing)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  return res.json({
    success: true,
    data: foundAutoPartListing,
  });
};

module.exports.compareIndividualCar = async (req, res, next) => {
  const { carid1, carid2 } = req.params;

  const foundCarListing1 = await CarListing.findOneAndUpdate(
    {
      _id: carid1,
      // status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    })
    .populate({
      path: "carSize",
    });

  if (!foundCarListing1)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  const foundCarListing2 = await CarListing.findOneAndUpdate(
    {
      _id: carid2,
      status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });
  if (!foundCarListing2)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  return res.json({
    success: true,
    data: [foundCarListing1, foundCarListing2],
  });
};

module.exports.showIndividualBikeListing = async (req, res, next) => {
  const { link_id } = req.params;
  console.log(link_id);
  const foundBikeListing = await BikeListing.findOneAndUpdate(
    {
      link_id,
      status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });
  if (!foundBikeListing)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  return res.json({
    success: true,
    data: foundBikeListing,
  });
};

module.exports.compareIndividualBike = async (req, res, next) => {
  const { bikeid1, bikeid2 } = req.params;
  const foundBikeListing1 = await BikeListing.findOneAndUpdate(
    {
      _id: bikeid1,
      status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });
  if (!foundBikeListing1)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  const foundBikeListing2 = await BikeListing.findOneAndUpdate(
    {
      _id: bikeid2,
      status: "active",
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });
  if (!foundBikeListing2)
    return res.status(400).json({
      success: false,
      message: "Invalid listing specified",
    });
  return res.json({
    success: true,
    data: [foundBikeListing1, foundBikeListing2],
  });
};

module.exports.getMyAds = async (req, res, next) => {
  const { user } = req;

  const carListing = await CarListing.find({
    user: user._id,
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    })
    .populate({
      path: "carSize",
    });

  const bikeListing = await BikeListing.find({
    user: user._id,
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "features",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    })
    .populate({
      path: "location",
    })
    .populate({
      path: "registration_city",
    });

  const autoPartListing = await AutoPartsListing.find({
    user: user._id,
  })
    .sort({
      created_on: -1,
    })
    .populate({
      path: "user",
      select: "_id first_name last_name phone created_on",
    })
    .populate({
      path: "category",
    })
    .populate({
      path: "sub_category",
    })
    .populate({
      path: "brand",
    })
    .populate({
      path: "model",
    });

  return res.json({
    success: true,
    data: [
      {
        cars: carListing,
        bikes: bikeListing,
        autoParts: autoPartListing,
      },
    ],
  });
};

module.exports.getMyOrders = async (req, res, next) => {
  const { user } = req;

  const orders = await Order.find({
    user: user._id,
  }).populate({ path: "parts" });

  return res.json({
    success: true,
    data: orders,
  });
};

module.exports.createNewCarListing = async (req, res, next) => {
  const { user, body, files } = req;

  const imgObjs = [];
  let validatedBody;

  // console.log("Body: ", body);
  // console.log("Files: ", files);
  try {
    validatedBody = await carListingSchema.validateAsync(body, {
      abortEarly: false,
    });
  } catch (err) {
    console.log(err);
    const x = err.details.map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: x,
    });
  }

  if (!files || files?.length < 1)
    return res.status(400).json({
      success: false,
      message: "You have to upload at least one image to the listing",
    });

  for (const file of files) {
    const { path } = file;
    try {
      const result = await cloudinary.uploader.upload(path, {
        folder: "pak-auto",
      });
      imgObjs.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
      fs.unlinkSync(path);
    } catch (err) {
      if (imgObjs?.length) {
        const imgs = imgObjs.map((obj) => obj.public_id);
        cloudinary.api.delete_resources(imgs);
      }
      return console.log(err);
    }
  }

  const newListing = new CarListing({
    user,
    ...validatedBody,
    images: imgObjs,
  });
  console.log(newListing);
  await newListing.save();
  console.log(123);
  return res.json({
    success: true,
    listingId: newListing.link_id,
    message: "Your car listing was created successfully",
  });
};

module.exports.biddingOnCar = async (req, res) => {
  try {
    const { user } = req;
    const biddingAmount = req.body.biddingAmount;
    const carId = req.params.carId;

    if (!biddingAmount) {
      return res.status(400).send("You have to provide biddingAmount");
    }

    const car = await CarListing.findById(carId);
    if (!car) {
      return res.status(400).send("No Car found on that Id");
    }
    if (car.type == "normal") {
      return res.status(400).send("This Car is not for auction");
    }
    const BidDiff = car.bidding_difference;
    const currentAmount = car.current_bidding;
    console.log(currentAmount);
    if (currentAmount) {
      const cars = await CarListing.findById(carId).populate({
        path: "current_bidding",
      });
      const cuurentAmount =
        cars.current_bidding.biddingAmount + cars.bidding_difference;
      console.log(cuurentAmount);
      if (cuurentAmount >= biddingAmount) {
        return res
          .status(400)
          .send(
            `Bidding amount must be ${BidDiff}$ greater then Current amount `
          );
      }
    }
    if (BidDiff > biddingAmount) {
      return res
        .status(400)
        .send(
          "Bidding amount must be greater then or equal to bidding difference"
        );
    }
    const carBidding = new CarBidding({
      biddingAmount,
      carId,
      userId: user,
    });
    await carBidding.save();

    car.current_bidding = carBidding._id;

    await car.save();
    return res.status(200).send({
      success: true,
      message: "You bid has been successfully added",
      data: carBidding,
      carDetail: car,
    });
    console.log(carBidding);
  } catch (error) {
    console.log();
  }
};

module.exports.getCarAllBids = async (req, res) => {
  const carId = req.params.carId;
  const car = await CarListing.findById(carId);
  console.log(car);
  if (!car) {
    return res.status(400).send("No car found on that id");
  }
  const bidd = await CarBidding.find({ carId: carId });
  console.log(bidd);
  if (!bidd.length < 0) {
    return res.status(400).send("No bids found on that Car");
  }
  return res.status(200).send({ success: true, data: bidd });
};

module.exports.getBidsByUser = async (req, res) => {
  const { user } = req;
  console.log(user);
  const bidd = await CarBidding.find({ userId: user });
  if (!bidd.length < 0) {
    return res.status(400).send("No user bids found ");
  }
  return res.status(200).send({ success: true, data: bidd });
};

module.exports.createNewOrder = async (req, res, next) => {
  const { parts, user, address } = req.body;

  try {
    // Verify that the requested products are available in your inventory
    const productsPresent = await AutoPartsListing.find({
      _id: { $in: parts },
    });

    console.log(parts, user, address, productsPresent);

    if (productsPresent.length !== parts.length) {
      throw new Error("One or more products are out of stock");
    }

    // Calculate the total price of the order
    const totalPrice = productsPresent.reduce(
      (total, part) => total + part.price,
      0
    );

    // Create an order in your database with the details of the products and the customer
    const order = new Order({
      parts: parts,
      user: user,
      address: address,
      total: totalPrice,
    });
    await order.save();

    // Once the order has been processed, send a confirmation email to the customer
    console.log(`Order for ${parts.length} products created successfully`);
    // TODO: Implement email sending logic

    // Return a response to the client
    res.status(201).json({
      message: "Auto Part order created successfully",
      success: true,
      data: order,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports.createNewAutoPartListing = async (req, res, next) => {
  const { user, body, files } = req;
  const imgObjs = [];
  let validatedBody;

  console.log("Body: ", body);
  console.log("Files: ", files);

  try {
    validatedBody = await autoPartSchema.validateAsync(body, {
      abortEarly: false,
    });
  } catch (err) {
    return console.log(err);
  }

  if (!files || files?.length < 1)
    return res.status(401).json({
      success: false,
      message: "You have to upload at least one image to the listing",
    });

  for (const file of files) {
    const { path } = file;
    try {
      const result = await cloudinary.uploader.upload(path, {
        folder: "pak-auto/parts",
      });
      imgObjs.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
      fs.unlinkSync(path);
    } catch (err) {
      if (imgObjs?.length) {
        const imgs = imgObjs.map((obj) => obj.public_id);
        cloudinary.api.delete_resources(imgs);
      }
      return console.log(err);
    }
  }

  const newListing = new AutoPartsListing({
    user,
    ...validatedBody,
    images: imgObjs,
  });
  try {
    await newListing.save();
    return res.json({
      success: true,
      listingId: newListing._id,
      message: "Your Auto Part listing was created successfully",
    });
  } catch {
    const imgs = imgObjs.map((obj) => obj.public_id);
    cloudinary.api.delete_resources(imgs);
    return console.log(err);
  }
};

module.exports.createNewBikeListing = async (req, res, next) => {
  const { user, body, files } = req;
  const imgObjs = [];
  let validatedBody;

  console.log("Body: ", body);
  console.log("Files: ", files);

  try {
    validatedBody = await bikeListingSchema.validateAsync(body, {
      abortEarly: false,
    });
  } catch (err) {
    return next(err);
  }

  if (!files || files?.length < 1)
    return res.status(401).json({
      success: false,
      message: "You have to upload at least one image to the listing",
    });

  for (const file of files) {
    const { path } = file;
    try {
      const result = await cloudinary.uploader.upload(path, {
        folder: "pak-auto",
      });
      imgObjs.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
      fs.unlinkSync(path);
    } catch (err) {
      if (imgObjs?.length) {
        const imgs = imgObjs.map((obj) => obj.public_id);
        cloudinary.api.delete_resources(imgs);
      }
      return next(err);
    }
  }

  const newListing = new BikeListing({
    user,
    ...validatedBody,
    images: imgObjs,
  });

  try {
    await newListing.save();
    return res.json({
      success: true,
      listingId: newListing.link_id,
      message: "Your bike listing was created successfully",
    });
  } catch (err) {
    const imgs = imgObjs.map((obj) => obj.public_id);
    cloudinary.api.delete_resources(imgs);
    return next(err);
  }
};

module.exports.createNewChat = async (req, res, next) => {
  try {
    const foundMatch = await Match.findOne({
      $or: [
        { $and: [{ matchA: req.body.userMe }, { matchB: req.body.userU }] },
        { $and: [{ matchA: req.body.userU }, { matchB: req.body.userMe }] },
      ],
    });

    if (foundMatch != null) {
      const user = await User.findOne({
        _id: req.body.userU,
      });

      const match = {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        refId: foundMatch.refId,
      };
      return res.status(200).send({ success: true, data: match });
    } else {
      const matchData = {
        refId: uuidv4(),
        matchA: req.body.userMe,
        matchB: req.body.userU,
      };

      let newMatch = new Match(matchData);
      newMatch = await newMatch.save();

      const user = await User.findOne({
        _id: req.body.userU,
      });

      const match = {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        refId: newMatch.refId,
      };
      return res.status(200).send({ success: true, data: match });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      error,
    });
  }
};

module.exports.checkFcm = async (req, res, next) => {
  const { user } = req;

  try {
    let foundUser = await User.findOne({
      _id: user._id,
    });

    if (foundUser.fcm_token === req.body.fcm_token) {
      res.status(200).send({
        status: true,
        data: "FCM token is same",
      });
    } else {
      foundUser.fcm_token = req.body.fcm_token;
      foundUser = await foundUser.save();
      res.status(200).send({
        status: true,
        data: "FCM token updated",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      data: error,
    });
  }
};

module.exports.sendNoti = async (req, res, next) => {
  const { user } = req;
  const data = req.body;
  try {
    let foundUser = await User.findOne({
      _id: data.clientId,
    });

    if (!foundUser)
      return res.status(500).send({
        status: false,
        data: "User Not Found",
      });

    var message = {
      to: foundUser?.fcm_token,

      notification: {
        title: data.title,
        body: data.body,
      },

      data: data.extra,
    };

    fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!");
      } else {
        res.status(200).send({
          success: true,
          data: "Successfully sent with response: " + response,
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      data: error,
    });
  }
};

module.exports.chatList = async (req, res, next) => {
  const { user } = req;
  try {
    const foundMatch = await Match.find({
      $or: [{ matchA: user._id }, { matchB: user._id }],
    });

    if (!foundMatch.length) {
      return res.status(400).send({
        status: false,
        error: "no matches found for this user",
      });
    }

    let matchedUsers = [];
    foundMatch.map((m) => {
      if (m.matchA !== user._id.toString()) {
        matchedUsers.push({
          userId: user._id.toString(),
          matchId: m.matchA,
          refId: m.refId,
        });
      } else {
        matchedUsers.push({
          userId: user._id.toString(),
          matchId: m.matchB,
          refId: m.refId,
        });
      }
    });
    let finalDataIds = matchedUsers.map((item) => {
      return item.matchId;
    });

    const users = await User.find({
      _id: { $in: finalDataIds },
    });

    let finalData = users.map((user) => ({
      first_name: user.first_name,
      last_name: user.last_name,
      id: user._id.toString(),
      phone: user.phone,
      refId: matchedUsers.find((mUser) => {
        return mUser.matchId === user._id.toString();
      })["refId"],
    }));

    return res.status(200).send({ success: true, data: finalData });
  } catch (error) {
    res.status(500).send({
      status: false,
      data: error,
    });
  }
};

module.exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("No user found on that email");
    }
    const userId = user._id;
    const token = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    await sendResetEmail(email, token);
    res.json({
      success: true,
      message: "Check your email for the verification code.",
      token,
      userId,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      data: error,
    });
  }
};

module.exports.handleUserUpdate = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { email, first_name, last_name, password, phone, location } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.email = email || user.email;
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.phone = phone || user.phone;
    user.location = location || user.location;

    if (password) {
      const { hash, salt } = genPasswordAndHash(req.body.password);
      user.hash = hash || user.hash;
      user.salt = salt || user.salt;
    }

    await user.save();
    res.status(200).send({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.updateCarListing = async (req, res, next) => {
  try {
    const carId = req.params.Id;
    const imgObjs = [];
    const files = req.files;

    if (files || files?.length > 0) {
      for (const file of files) {
        const { path } = file;
        try {
          const result = await cloudinary.uploader.upload(path, {
            folder: "pak-auto",
          });
          imgObjs.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
          fs.unlinkSync(path);
        } catch (err) {
          if (imgObjs?.length) {
            const imgs = imgObjs.map((obj) => obj.public_id);
            cloudinary.api.delete_resources(imgs);
          }
          return console.log(err);
        }
      }
    }

    const {
      title,
      description,
      features,
      location,
      brand,
      model,
      model_year,
      registration_city,
      condition,
      body_color,
      price,
      distance_driven,
      fuel_type,
      engine_capacity,
      battery_capacity,
      transmission_type,
      assembly,
    } = req.body;

    const car = await CarListing.findById(carId);
    if (!car) {
      return res.status(400).send({ message: "we can not find your car" });
    }
    car.title = title || car.title;
    car.description = description || car.description;
    car.features = features || car.features;
    car.location = location || car.location;
    car.brand = brand || car.brand;
    car.model = model || car.model;
    car.model_year = model_year || car.model_year;
    car.registration_city = registration_city || car.registration_city;
    car.condition = condition || car.condition;
    car.body_color = body_color || car.body_color;
    car.price = price || car.price;
    car.distance_driven = distance_driven || car.distance_driven;
    car.fuel_type = fuel_type || car.fuel_type;
    car.engine_capacity = engine_capacity || car.engine_capacity;
    car.battery_capacity = battery_capacity || car.battery_capacity;
    car.transmission_type = transmission_type || car.transmission_type;
    car.assembly = assembly || car.assembly;
    car.transmission_type = transmission_type || car.transmission_type;

    if (imgObjs?.length > 0) {
      car.images = [...imgObjs];
    } else {
      car.images = car.images;
    }

    await car.save();
    res
      .status(200)
      .send({ success: true, message: "Product has been updated" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.updateBikeListing = async (req, res, next) => {
  try {
    const bikeId = req.params.Id;
    const imgObjs = [];
    const files = req.files;

    if (files || files?.length > 0) {
      for (const file of files) {
        const { path } = file;
        try {
          const result = await cloudinary.uploader.upload(path, {
            folder: "pak-auto",
          });
          imgObjs.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
          fs.unlinkSync(path);
        } catch (err) {
          if (imgObjs?.length) {
            const imgs = imgObjs.map((obj) => obj.public_id);
            cloudinary.api.delete_resources(imgs);
          }
          return console.log(err);
        }
      }
    }

    const {
      title,
      description,
      features,
      location,
      brand,
      model,
      model_year,
      registration_city,
      condition,
      price,
      distance_driven,
      engine_type,
    } = req.body;

    const bike = await BikeListing.findById(bikeId);
    if (!bike) {
      return res.status(400).send({ message: "we can not find your bike" });
    }
    bike.title = title || bike.title;
    bike.description = description || bike.description;
    bike.features = features || bike.features;
    bike.location = location || bike.location;
    bike.brand = brand || bike.brand;
    bike.model = model || bike.model;
    bike.model_year = model_year || bike.model_year;
    bike.registration_city = registration_city || bike.registration_city;
    bike.condition = condition || bike.condition;
    bike.price = price || bike.price;
    bike.distance_driven = distance_driven || bike.distance_driven;
    bike.engine_type = engine_type || bike.engine_type;

    if (imgObjs?.length > 0) {
      bike.images = [...imgObjs];
    } else {
      bike.images = bike.images;
    }

    await bike.save();
    res
      .status(200)
      .send({ success: true, message: "Product has been updated" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.updatePartListing = async (req, res, next) => {
  try {
    const partId = req.params.Id;
    const imgObjs = [];
    const files = req.files;

    if (files || files?.length > 0) {
      for (const file of files) {
        const { path } = file;
        try {
          const result = await cloudinary.uploader.upload(path, {
            folder: "pak-auto",
          });
          imgObjs.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
          fs.unlinkSync(path);
        } catch (err) {
          if (imgObjs?.length) {
            const imgs = imgObjs.map((obj) => obj.public_id);
            cloudinary.api.delete_resources(imgs);
          }
          return console.log(err);
        }
      }
    }

    const { title, description, category, sub_category, brand, model, price } =
      req.body;

    const part = await AutoPartsListing.findById(partId);
    if (!part) {
      return res.status(400).send({ message: "we can not find your part" });
    }
    part.title = title || part.title;
    part.description = description || part.description;
    part.category = category || part.category;
    part.sub_category = sub_category || part.sub_category;
    part.brand = brand || part.brand;
    part.model = model || part.model;
    part.price = price || part.price;

    if (imgObjs?.length > 0) {
      part.images = [...imgObjs];
    } else {
      part.images = part.images;
    }

    await part.save();
    res
      .status(200)
      .send({ success: true, message: "Product has been updated" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.createBikeModel = async (req, res, next) => {
  try {
    const body = req.body;
    console.log(body);
    try {
      validatedBody = await modelBikeSchema.validateAsync(body, {
        abortEarly: false,
      });

      const newModel = new BikeModel({
        ...validatedBody,
      });
      await newModel.save();
      return res
        .status(200)
        .send({ success: true, message: "Bike Model Added", data: newModel });
    } catch (err) {
      return console.log(err);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.sendBikeModel = async (req, res, next) => {
  try {
    const pageNumber = Number(req.params.pageNumber);
    const skipping = (pageNumber - 1) * 20;

    const allModel = await BikeModel.find()
      .sort({
        created_on: -1,
      })
      .skip(skipping)
      .limit(20)
      .populate({
        path: "CarBrand",
      });

    return res.json({
      success: true,
      data: allModel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.createCarModel = async (req, res, next) => {
  try {
    const body = req.body;
    console.log(body);
    try {
      validatedBody = await modelCarSchema.validateAsync(body, {
        abortEarly: false,
      });

      const newModel = new CarModel({
        ...validatedBody,
      });
      await newModel.save();
      return res
        .status(200)
        .json({ success: true, message: "Bike Model Added", data: newModel });
    } catch (err) {
      return console.log(err);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.sendCarModel = async (req, res, next) => {
  try {
    const pageNumber = Number(req.params.pageNumber);
    const skipping = (pageNumber - 1) * 20;

    const allModel = await CarModel.find()
      .sort({
        created_on: -1,
      })
      .skip(skipping)
      .limit(20)
      .populate({
        path: "brand",
      });
    console.log(allModel);
    return res.json({
      success: true,
      data: allModel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.sendCarByBrandModel = async (req, res, next) => {
  try {
    const pageNumber = Number(req.params.pageNumber);
    const skipping = (pageNumber - 1) * 20;

    const allModel = await CarModel.find({ brand: req.params.brandId })
      .sort({
        created_on: -1,
      })
      .skip(skipping)
      .limit(20)
      .populate({
        path: "brand",
      });
    console.log(allModel);
    return res.json({
      success: true,
      data: allModel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.createCarBrand = async (req, res, next) => {
  try {
    const { body, files } = req;

    const imgObjs = [];
    let validatedBody;

    console.log("Body: ", body);
    console.log("Files: ", files);
    try {
      validatedBody = await brandCarSchema.validateAsync(body, {
        abortEarly: false,
      });
    } catch (err) {
      return console.log(err);
    }

    const name = body.name;
    const existingListing = await CarBrand.findOne({ name: name });
    console.log(existingListing);
    if (existingListing) {
      return res
        .status(400)
        .send({ success: false, message: "This brand is already exist" });
    }

    if (!files || files?.length < 1)
      return res.status(400).json({
        success: false,
        message: "You have to upload at least one image to the listing",
      });

    for (const file of files) {
      const { path } = file;
      try {
        const result = await cloudinary.uploader.upload(path, {
          folder: "pak-auto",
        });
        imgObjs.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
        fs.unlinkSync(path);
      } catch (err) {
        if (imgObjs?.length) {
          const imgs = imgObjs.map((obj) => obj.public_id);
          cloudinary.api.delete_resources(imgs);
        }
        return console.log(err);
      }
    }

    const newListing = new CarBrand({
      name: name,
      image: imgObjs[0].url,
    });

    try {
      await newListing.save();
      return res.json({
        success: true,
        data: newListing,
        message: "Your car listing was created successfully",
      });
    } catch {
      const imgs = imgObjs.map((obj) => obj.public_id);
      cloudinary.api.delete_resources(imgs);
      return console.log(err);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.createBikeBrand = async (req, res, next) => {
  try {
    const { body, files } = req;

    const imgObjs = [];
    let validatedBody;

    console.log("Body: ", body);
    console.log("Files: ", files);
    try {
      validatedBody = await brandBikeSchema.validateAsync(body, {
        abortEarly: false,
      });
    } catch (err) {
      return console.log(err);
    }

    const name = body.name;
    const existingListing = await BikeBrand.findOne({ name: name });
    console.log(existingListing);
    if (existingListing) {
      return res
        .status(400)
        .send({ success: false, message: "This brand is already exist" });
    }

    if (!files || files?.length < 1)
      return res.status(400).json({
        success: false,
        message: "You have to upload at least one image to the listing",
      });

    for (const file of files) {
      const { path } = file;
      try {
        const result = await cloudinary.uploader.upload(path, {
          folder: "pak-auto",
        });
        imgObjs.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
        fs.unlinkSync(path);
      } catch (err) {
        if (imgObjs?.length) {
          const imgs = imgObjs.map((obj) => obj.public_id);
          cloudinary.api.delete_resources(imgs);
        }
        return console.log(err);
      }
    }

    const newListing = new BikeBrand({
      name: name,
      image: imgObjs[0].url,
    });

    try {
      await newListing.save();
      return res.json({
        success: true,
        data: newListing,
        message: "Your Bike listing was created successfully",
      });
    } catch {
      const imgs = imgObjs.map((obj) => obj.public_id);
      cloudinary.api.delete_resources(imgs);
      return console.log(err);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.createBikeFeature = async (req, res, next) => {
  try {
    const body = req.body;

    let validatedBody;

    console.log("Body: ", body);

    try {
      validatedBody = await featureBikeSchema.validateAsync(body, {
        abortEarly: false,
      });
    } catch (err) {
      return console.log(err);
    }

    const name = body.name;
    const existingListing = await BikeFeature.findOne({ name: name });
    if (existingListing) {
      return res
        .status(400)
        .send({ success: false, message: "This feature is already exist" });
    }

    const newListing = new BikeFeature({
      name: name,
    });

    await newListing.save();
    return res.json({
      success: true,
      data: newListing,
      message: "Your Bike feature is listed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.createCarFeature = async (req, res, next) => {
  try {
    const body = req.body;

    let validatedBody;

    console.log("Body: ", body);

    try {
      validatedBody = await featureCarSchema.validateAsync(body, {
        abortEarly: false,
      });
    } catch (err) {
      return console.log(err);
    }

    const name = body.name;
    const existingListing = await CarFeature.findOne({ name: name });
    if (existingListing) {
      return res
        .status(400)
        .send({ success: false, message: "This feature is already exist" });
    }

    const newListing = new CarFeature({
      name: name,
    });

    await newListing.save();
    return res.json({
      success: true,
      data: newListing,
      message: "Your Car feature is listed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.createCarSize = async (req, res, next) => {
  try {
    const { body, files } = req;

    const imgObjs = [];
    let validatedBody;

    console.log("Body: ", body);
    console.log("Files: ", files);
    try {
      validatedBody = await sizeCarSchema.validateAsync(body, {
        abortEarly: false,
      });
    } catch (err) {
      const x = err.error.details.map((error) => error.message);
      return res.status(400).json({
        success: false,
        message: x,
      });
    }

    const carSize = body.carSize;
    const existingListing = await CarSize.findOne({ carSize: carSize });
    if (existingListing) {
      return res
        .status(400)
        .send({ success: false, message: "This brand is already exist" });
    }
    if (!files || files?.length < 1)
      return res.status(400).json({
        success: false,
        message: "You have to upload at least one image to the listing",
      });

    for (const file of files) {
      const { path } = file;
      try {
        const result = await cloudinary.uploader.upload(path, {
          folder: "pak-auto",
        });
        imgObjs.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
        fs.unlinkSync(path);
      } catch (err) {
        if (imgObjs?.length) {
          const imgs = imgObjs.map((obj) => obj.public_id);
          cloudinary.api.delete_resources(imgs);
        }
        return console.log(err);
      }
    }
    const newListing = new CarSize({
      carSize: carSize,
      images: imgObjs[0].url,
    });
    console.log(newListing);
    try {
      await newListing.save();
      return res.json({
        success: true,
        data: newListing,
        message: "Your car Size has been added",
      });
    } catch {
      const imgs = imgObjs.map((obj) => obj.public_id);
      cloudinary.api.delete_resources(imgs);
      return console.log(err);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.sendAllCarSize = async (req, res, next) => {
  const allBrands = await CarSize.find();
  res.json({
    success: true,
    data: allBrands,
  });
};

module.exports.deleteCarListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    await CarListing.findByIdAndDelete(listingId);
    return res.status(200).send({
      success: true,
      message: "Your Add has been deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Internal server error " });
  }
};

module.exports.savedCars = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    const carId = req.params.id;

    const userFromDB = await User.findById(user);
    if (!userFromDB) {
      return res.status(404).send("User not found");
    }
    if (userFromDB.savedCars.includes(carId)) {
      // return res.status(400).send("Blog already saved");

      userFromDB.savedCars = userFromDB.savedCars.filter(
        (item) => item.toString() != carId
      );

      await userFromDB.save();

      return res.status(200).send("Blog unsaved successfully");
    }

    userFromDB.savedCars.push(carId);

    await userFromDB.save();

    return res.status(200).send("Blog saved successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};

module.exports.showAuctionCarListings = async (req, res, next) => {
  const pageNumber = Number(req.params.pageNumber);
  const location = req.params.location;
  const skipping = (pageNumber - 1) * 20;
  const listings =
    location == "all"
      ? await CarListing.find({
          // status: "active",
          type: "auction",
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          })
      : await CarListing.find({
          // status: "active",
          type: "auction",
          location: location,
        })
          .sort({
            created_on: -1,
          })
          .skip(skipping)
          .limit(20)
          .populate({
            path: "location",
          })
          .populate({
            path: "features",
          })
          .populate({
            path: "brand",
          })
          .populate({
            path: "model",
          })
          .populate({
            path: "registration_city",
          });

  return res.json({
    success: true,
    data: listings,
  });
};
