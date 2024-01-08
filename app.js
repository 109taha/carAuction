require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const passport = require("passport");
const configPassport = require("./config/passport");
const connectToMongoDB = require("./config/connectToMongoDb");
const allRoutes = require("./routes/allRoutes");
const expressErrorHandler = require("./utils/expressErrorHandler");

const PORT = process.env.PORT || 4000;

connectToMongoDB();
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
configPassport(app, passport);

app.use("/", allRoutes);

app.use(expressErrorHandler);

app.listen(PORT, () => {
  console.log(`Listening at ${PORT}`);
});
