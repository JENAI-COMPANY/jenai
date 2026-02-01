/**
 * Middleware للتحقق من صلاحيات المستخدمين
 */

// التحقق من صلاحية معينة
const checkPermission = (permissionName) => {
  return (req, res, next) => {
    const user = req.user;

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return next();
    }

    // Check if user has the specific permission
    if (!user.permissions || !user.permissions[permissionName]) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission: ${permissionName}`
      });
    }

    next();
  };
};

// التحقق من أن المستخدم مدير منطقة وله صلاحية على منطقة معينة
const checkRegionalAccess = async (req, res, next) => {
  const user = req.user;

  // Super admin has access to everything
  if (user.role === 'super_admin') {
    return next();
  }

  // Check if user is regional admin
  if (user.role !== 'regional_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Regional admin role required'
    });
  }

  // Check if user has a region assigned
  if (!user.region) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No region assigned to your account'
    });
  }

  // Store user's region in request for later use
  req.userRegion = user.region;
  next();
};

// التحقق من أن المستخدم مدير قسم وله صلاحية على قسم معين
const checkCategoryAccess = (categoryParam = 'category') => {
  return async (req, res, next) => {
    const user = req.user;

    // Super admin has access to everything
    if (user.role === 'super_admin') {
      return next();
    }

    // Check if user is category admin
    if (user.role !== 'category_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Category admin role required'
      });
    }

    // Check if user has categories assigned
    if (!user.managedCategories || user.managedCategories.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No categories assigned to your account'
      });
    }

    // Get the category from request (body, params, or query)
    const requestedCategory = req.body[categoryParam] || req.params[categoryParam] || req.query[categoryParam];

    // If no specific category requested, allow (user will see filtered results)
    if (!requestedCategory) {
      req.userCategories = user.managedCategories;
      return next();
    }

    // Check if user has access to the requested category
    if (!user.managedCategories.includes(requestedCategory)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to manage category: ${requestedCategory}`
      });
    }

    req.userCategories = user.managedCategories;
    next();
  };
};

// التحقق من أن المستخدم له صلاحية عرض الأعضاء
const canViewMembers = checkPermission('canViewMembers');

// التحقق من أن المستخدم له صلاحية إدارة الأعضاء
const canManageMembers = checkPermission('canManageMembers');

// التحقق من أن المستخدم له صلاحية عرض المنتجات
const canViewProducts = checkPermission('canViewProducts');

// التحقق من أن المستخدم له صلاحية إدارة المنتجات
const canManageProducts = checkPermission('canManageProducts');

module.exports = {
  checkPermission,
  checkRegionalAccess,
  checkCategoryAccess,
  canViewMembers,
  canManageMembers,
  canViewProducts,
  canManageProducts
};
