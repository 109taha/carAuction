const crypto = require("crypto");

function validPassword(password, hash, salt) {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

function genPasswordAndHash(password) {
    const salt = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt,
        hash
    };
}

module.exports.validPassword = validPassword;
module.exports.genPasswordAndHash = genPasswordAndHash;