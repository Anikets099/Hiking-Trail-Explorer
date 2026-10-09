const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(
    `[api-error] ${req.method} ${req.originalUrl} status=${err.statusCode || 500} code=${err.code || 'UNEXPECTED_ERROR'} message=${err.searchDetails || err.message}`
  );

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found with the provided identifier.'
    });
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `A record with that ${field} already exists.`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }

  const responseBody = {
    success: false,
    message: err.message || 'Internal Server Error'
  };
  if (['GEOCODING_UNAVAILABLE', 'TRAIL_SEARCH_UNAVAILABLE'].includes(err.code)) {
    responseBody.code = err.code;
  }
  if (err.diagnostics) {
    responseBody.diagnostics = err.diagnostics;
  }

  console.error(`[api-error] response=${JSON.stringify(responseBody)}`);
  res.status(err.statusCode || 500).json(responseBody);
};

module.exports = errorHandler;
