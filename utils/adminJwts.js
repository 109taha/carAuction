const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ADMIN_ACCESS_PRIV_KEY = process.env.A_ACCESS_PRIV_KEY || fs.readFileSync(path.join(__dirname, "../auth_keys/admin/accessToken_private_key.pem"), { encoding: "utf8" });
const ADMIN_ACCESS_PUB_KEY = process.env.A_ACCESS_PRIV_KEY || fs.readFileSync(path.join(__dirname, "../auth_keys/admin/accessToken_public_key.pem"), { encoding: "utf8" });

module.exports.issueAdminAccessToken = (admin) => {
    const { _id, email } = admin;
    const expiresIn = "1d";

    const payload = {
        _id,
        email
    };

    const accessToken = jwt.sign(
        payload,
        ADMIN_ACCESS_PRIV_KEY,
        { expiresIn, algorithm: "RS256" }
    );

    return {
        accessToken: `Bearer ${accessToken}`,
        expires: expiresIn
    };
}