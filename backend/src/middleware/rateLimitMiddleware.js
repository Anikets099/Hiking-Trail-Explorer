const rateLimit = require('express-rate-limit');

// Limiter for authentication routes (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for general API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    success: false,
    message: 'Upload rate limit reached. Please wait before uploading again.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter
};
