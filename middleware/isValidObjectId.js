const isValidObjectId = (req, res, next) => {
    const { id } = req.params;
    const objIdRegex = /^[a-f\d]{24}$/i;
    const isValid = objIdRegex.test(id);

    if(!isValid) return res.status(406).json({ success: false, message: "Your requested resource couldn't be found"});
    
    return next();
};

module.exports = isValidObjectId;