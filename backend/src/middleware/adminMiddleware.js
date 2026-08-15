const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin privileges are required to perform this action.'
    });
  }
  next();
};

module.exports = {
  requireAdmin
};
