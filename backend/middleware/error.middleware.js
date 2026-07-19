export const errorHandler = (err, req, res, next) => {
    req.log.error({
    err,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    statusCode: err.statusCode,
    });
    res.status(err.statusCode || 500).json({

        success: false,
        type: err.type || "ServerError",
        message: err.message || "Internal Server Error"
    
    });

};