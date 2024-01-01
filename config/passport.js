const fs = require("fs");
const path = require("path");
const Admin = require("../models/Admin");
const User = require("../models/User");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const USER_ACCESS_PUB_KEY = process.env.U_ACCESS_PUB_KEY || fs.readFileSync(path.join(__dirname, "../auth_keys/user/accessToken_public_key.pem"), { encoding: "utf8" });
const ADMIN_ACCESS_PUB_KEY = process.env.A_ACCESS_PUB_KEY || fs.readFileSync(path.join(__dirname, "../auth_keys/admin/accessToken_public_key.pem"), { encoding: "utf8" });

const userOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: USER_ACCESS_PUB_KEY,
    algorithms: ["RS256"]
};

const adminOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: ADMIN_ACCESS_PUB_KEY,
    algorithms: ["RS256"]
};

module.exports = (app, passport) => {
    app.use(passport.initialize());
    passport.use("user", new JwtStrategy(userOptions, async function(payload, done) {
        try {
            const user = await User.findById(payload?._id);
            if(!user) return done(null, false);
            return done(null, user);
        } catch(err) {
            return done(err, false);
        }
    }));

    passport.use("admin", new JwtStrategy(adminOptions, async function(payload, done) {
        try {
            const admin = await Admin.findById(payload?._id);    
            if(!admin) return done(null, false);
            return done(null, admin);
        } catch(err) {
            return done(err, false);
        }
    }));
};