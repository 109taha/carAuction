const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ADMIN_ACCESS_PRIV_KEY =
  process.env.A_ACCESS_PRIV_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/admin/accessToken_private_key.pem"),
    { encoding: "utf8" }
  );
const ADMIN_ACCESS_PUB_KEY =
  process.env.A_ACCESS_PUB_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/admin/accessToken_public_key.pem"),
    { encoding: "utf8" }
  );
const USER_REFRESH_PRIV_KEY =
  process.env.U_REFRESH_PRIV_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/user/refreshToken_private_key.pem"),
    { encoding: "utf8" }
  );
const USER_REFRESH_PUB_KEY =
  process.env.U_REFRESH_PUB_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/user/refreshToken_public_key.pem"),
    { encoding: "utf8" }
  );
const USER_ACCESS_PRIV_KEY =
  process.env.U_ACCESS_PRIV_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/user/accessToken_private_key.pem"),
    { encoding: "utf8" }
  );
const USER_ACCESS_PUB_KEY =
  process.env.U_ACCESS_PUB_KEY ||
  fs.readFileSync(
    path.join(__dirname, "../auth_keys/user/accessToken_public_key.pem"),
    { encoding: "utf8" }
  );

module.exports.issueUserRefreshToken = (user) => {
  const { _id, email } = user;
  const expiresIn = "90d";

  const payload = {
    _id,
    email,
  };

  const refreshToken = jwt.sign(payload, USER_REFRESH_PRIV_KEY, {
    expiresIn,
    algorithm: "RS256",
  });

  return {
    refreshToken: `Bearer ${refreshToken}`,
    expires: expiresIn,
  };
};

module.exports.issueUserAccessToken = (user) => {
  const { _id, email } = user;
  const expiresIn = "1d";

  const payload = {
    _id,
    email,
  };

  const accessToken = jwt.sign(payload, USER_ACCESS_PRIV_KEY, {
    expiresIn,
    algorithm: "RS256",
  });

  return {
    accessToken: `Bearer ${accessToken}`,
    expires: expiresIn,
  };
};

module.exports.issueAdminAccessToken = (admin) => {
  const { _id, email } = admin;
  const expiresIn = "1d";

  const payload = {
    _id,
    email,
  };

  const accessToken = jwt.sign(payload, ADMIN_ACCESS_PRIV_KEY, {
    expiresIn,
    algorithm: "RS256",
  });

  return {
    accessToken: `Bearer ${accessToken}`,
    expires: expiresIn,
  };
};
