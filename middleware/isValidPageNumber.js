module.exports = (req, res, next) => {
    const pageNumber = Number(req.params.pageNumber);
    if(Number.isInteger(pageNumber) && pageNumber > 0) {
        return next();
    }
    return next(new Error("Invalid page number"));
};