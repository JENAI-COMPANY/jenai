const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Validate that category_admin has access to a specific product
 * Super admin and regional admin have full access
 */
exports.validateProductAccess = async (req, res, next) => {
  // Super admin and regional admin bypass this check
  if (req.user.role !== 'category_admin') {
    return next();
  }

  const productId = req.params.id || req.body.productId;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID required',
      messageAr: 'معرف المنتج مطلوب'
    });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        messageAr: 'المنتج غير موجود'
      });
    }

    // Check if category_admin has access to this product's category
    if (!req.user.managedCategories || !req.user.managedCategories.includes(product.category)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You do not manage the category: ${product.category}`,
        messageAr: `غير مصرح. أنت لا تدير القسم: ${product.category}`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Validate that category_admin has access to a specific order
 * Super admin and regional admin have full access
 */
exports.validateOrderAccess = async (req, res, next) => {
  // Super admin and regional admin bypass this check
  if (req.user.role !== 'category_admin') {
    return next();
  }

  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId)
      .populate('orderItems.product', 'category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // Get all categories from order items
    const orderCategories = [...new Set(
      order.orderItems.map(item => item.product?.category).filter(Boolean)
    )];

    // Check if category_admin has access to at least one product in the order
    const hasAccess = orderCategories.some(cat =>
      req.user.managedCategories && req.user.managedCategories.includes(cat)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This order does not contain products from your managed categories.',
        messageAr: 'غير مصرح. هذا الطلب لا يحتوي على منتجات من أقسامك المخصصة.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
