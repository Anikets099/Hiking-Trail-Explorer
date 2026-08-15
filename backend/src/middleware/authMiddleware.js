const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trailexplorer_secret_key');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

// Optional auth: attaches user if valid token exists, otherwise continues
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trailexplorer_secret_key');
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (e) {
      // Ignore invalid token in optional auth
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticateUser,
  optionalAuth
};
