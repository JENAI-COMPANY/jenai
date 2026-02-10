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
    req.user = await User.findById(decoded.id).populate('region', 'name nameAr nameEn code');

    // Check if user account is active (super_admin is always allowed)
    if (req.user && req.user.role !== 'super_admin' && req.user.isActive === false) {
      return res.status(403).json({
        message: 'Your account is inactive. Please contact admin.',
        messageAr: 'حسابك غير نشط. يرجى التواصل مع الإدارة.'
      });
    }

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

// Check if user is category admin or super admin
exports.isCategoryAdmin = (req, res, next) => {
  if (!['category_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. Category admin privileges required.',
      messageAr: 'غير مصرح. صلاحيات مدير القسم مطلوبة.'
    });
  }
  next();
};

// Check if category admin has permission to view products
exports.canViewProducts = (req, res, next) => {
  // Super admin always has access
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check category admin permissions
  if (req.user.role === 'category_admin') {
    if (!req.user.permissions?.canViewProducts) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to view products.',
        messageAr: 'غير مصرح. ليس لديك صلاحية لعرض المنتجات.'
      });
    }
  }

  next();
};

// Check if category admin has permission to manage products
exports.canManageProducts = (req, res, next) => {
  // Super admin always has access
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check category admin permissions
  if (req.user.role === 'category_admin') {
    if (!req.user.permissions?.canManageProducts) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to manage products.',
        messageAr: 'غير مصرح. ليس لديك صلاحية للتحكم بالمنتجات.'
      });
    }
  }

  next();
};

// Check if category admin has permission to view orders
exports.canViewOrders = (req, res, next) => {
  // Super admin always has access
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check category admin permissions
  if (req.user.role === 'category_admin') {
    if (!req.user.permissions?.canViewOrders) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to view orders.',
        messageAr: 'غير مصرح. ليس لديك صلاحية لعرض الطلبات.'
      });
    }
  }

  next();
};

// Check if category admin has permission to manage orders
exports.canManageOrders = (req, res, next) => {
  // Super admin always has access
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check category admin permissions
  if (req.user.role === 'category_admin') {
    if (!req.user.permissions?.canManageOrders) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to manage orders.',
        messageAr: 'غير مصرح. ليس لديك صلاحية للتحكم بالطلبات.'
      });
    }
  }

  next();
};

// Check if user is any type of admin
exports.isAdmin = (req, res, next) => {
  if (!['regional_admin', 'category_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user is subscriber or super admin
exports.isSubscriber = (req, res, next) => {
  if (req.user.role !== 'subscriber' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Access denied. Subscriber privileges required.'
    });
  }
  next();
};

// Check if user is member or super admin
exports.memberOnly = (req, res, next) => {
  if (req.user.role !== 'member' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Access denied. Member privileges required.',
      messageAr: 'غير مصرح. صلاحيات العضو مطلوبة.'
    });
  }
  next();
};

// Check if user is supplier or super admin
exports.isSupplier = (req, res, next) => {
  if (req.user.role !== 'supplier' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Access denied. Supplier privileges required.',
      messageAr: 'غير مصرح. صلاحيات المورد مطلوبة.'
    });
  }
  next();
};

// Check if supplier is active
exports.checkSupplierActive = async (req, res, next) => {
  if (req.user.role === 'supplier' && !req.user.isActive) {
    return res.status(403).json({
      message: 'Your supplier account is inactive. Please contact admin.',
      messageAr: 'حساب المورد الخاص بك غير نشط. يرجى التواصل مع الإدارة.'
    });
  }
  next();
};

// Check if supplier has managed categories
exports.checkSupplierCategories = async (req, res, next) => {
  if (req.user.role === 'supplier') {
    if (!req.user.managedCategories || req.user.managedCategories.length === 0) {
      return res.status(403).json({
        message: 'No categories assigned to your account. Please contact admin.',
        messageAr: 'لا توجد أقسام مخصصة لحسابك. يرجى التواصل مع الإدارة.'
      });
    }
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
      req.user = await User.findById(decoded.id).populate('region', 'name nameAr nameEn code');
    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
    }
  }

  next();
};
