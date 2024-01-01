const isValidCarObjectIds = (req, res, next) => {
    const { carid1, carid2 } = req.params;

    const objIdRegex = /^[a-f\d]{24}$/i;
    const isValid1 = objIdRegex.test(carid1);
    const isValid2 = objIdRegex.test(carid2);

    if(!isValid1 || !isValid2) return res.status(406).json({ success: false, message: "Provide Correct Car Id"});
    
    return next();
};

const isValidBikeObjectIds = (req, res, next) => {
    const { bikeid1, bikeid2 } = req.params;

    const objIdRegex = /^[a-f\d]{24}$/i;
    const isValid1 = objIdRegex.test(bikeid1);
    const isValid2 = objIdRegex.test(bikeid2);

    if(!isValid1 || !isValid2) return res.status(406).json({ success: false, message: "Provide correct Bike Id"});
    
    return next();
};

module.exports = { isValidCarObjectIds, isValidBikeObjectIds };