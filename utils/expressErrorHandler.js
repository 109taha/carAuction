module.exports = function(err, req, res, next) {
    const { message = "Something went wrong" } = err;
    const statusCode = 500;
    res.status(statusCode).json({
        success: false,
        message
    });
};