const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is super admin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Access denied. Super admin privileges required.'
    });
  }
  next();
};

// Check if user is regional admin or super admin
exports.isRegionalAdmin = (req, res, next) => {
  if (req.user.role !== 'regional_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Access denied. Regional admin privileges required.'
    });
  }
  next();
};

// Check if user is any type of admin
exports.isAdmin = (req, res, next) => {
  if (!['regional_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user is subscriber
exports.isSubscriber = (req, res, next) => {
  if (req.user.role !== 'subscriber') {
    return res.status(403).json({
      message: 'Access denied. Subscriber privileges required.'
    });
  }
  next();
};

// Optional auth - doesn't require authentication but attaches user if token provided
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
    }
  }

  next();
};
