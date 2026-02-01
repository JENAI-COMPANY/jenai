const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @desc    Get supplier's own products
 * @route   GET /api/supplier/products
 * @access  Supplier only
 */
exports.getMyProducts = async (req, res) => {
  try {
    const { approvalStatus, category, isActive } = req.query;

    const filter = { supplier: req.user._id };

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const products = await Product.find(filter)
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add new product by supplier
 * @route   POST /api/supplier/products
 * @access  Supplier only
 */
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      customerPrice,
      subscriberPrice,
      bulkPrice,
      bulkMinQuantity,
      stock,
      points,
      bulkPoints,
      images,
      media,
      sku
    } = req.body;

    // التحقق من أن القسم مسموح به للمورد
    const supplier = await User.findById(req.user._id);

    if (!supplier.managedCategories || supplier.managedCategories.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No categories assigned to this supplier. Please contact admin.',
        messageAr: 'لا توجد أقسام مسموح بها لهذا المورد. يرجى التواصل مع الإدارة.'
      });
    }

    if (!supplier.managedCategories.includes(category)) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to add products in category: ${category}`,
        messageAr: `غير مصرح لك بإضافة منتجات في قسم: ${category}`,
        allowedCategories: supplier.managedCategories
      });
    }

    // إنشاء المنتج بحالة pending
    const product = await Product.create({
      name,
      description,
      category,
      customerPrice,
      subscriberPrice,
      bulkPrice,
      bulkMinQuantity,
      stock,
      points: points || 0,
      bulkPoints: bulkPoints || 0,
      images: images || [],
      media: media || [],
      sku,
      supplier: req.user._id,
      approvalStatus: 'pending', // ينتظر الموافقة
      isActive: false // غير نشط حتى تتم الموافقة
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully. Waiting for admin approval.',
      messageAr: 'تم إضافة المنتج بنجاح. بانتظار موافقة الإدارة.',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update supplier's product
 * @route   PUT /api/supplier/products/:id
 * @access  Supplier only
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      supplier: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to edit it',
        messageAr: 'المنتج غير موجود أو ليس لديك صلاحية لتعديله'
      });
    }

    const {
      name,
      description,
      category,
      customerPrice,
      subscriberPrice,
      bulkPrice,
      bulkMinQuantity,
      stock,
      points,
      bulkPoints,
      images,
      media
    } = req.body;

    // إذا تم تغيير القسم، التحقق من الصلاحية
    if (category && category !== product.category) {
      const supplier = await User.findById(req.user._id);

      if (!supplier.managedCategories.includes(category)) {
        return res.status(403).json({
          success: false,
          message: `You are not authorized to move products to category: ${category}`,
          messageAr: `غير مصرح لك بنقل المنتجات لقسم: ${category}`,
          allowedCategories: supplier.managedCategories
        });
      }
    }

    // تحديث الحقول
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (customerPrice !== undefined) product.customerPrice = customerPrice;
    if (subscriberPrice !== undefined) product.subscriberPrice = subscriberPrice;
    if (bulkPrice !== undefined) product.bulkPrice = bulkPrice;
    if (bulkMinQuantity !== undefined) product.bulkMinQuantity = bulkMinQuantity;
    if (stock !== undefined) product.stock = stock;
    if (points !== undefined) product.points = points;
    if (bulkPoints !== undefined) product.bulkPoints = bulkPoints;
    if (images) product.images = images;
    if (media) product.media = media;

    // إذا كان المنتج مرفوض وتم التعديل، نعيده لـ pending
    if (product.approvalStatus === 'rejected') {
      product.approvalStatus = 'pending';
      product.rejectionReason = undefined;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      messageAr: 'تم تحديث المنتج بنجاح',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete supplier's product
 * @route   DELETE /api/supplier/products/:id
 * @access  Supplier only
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      supplier: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it',
        messageAr: 'المنتج غير موجود أو ليس لديك صلاحية لحذفه'
      });
    }

    // يمكن للمورد حذف المنتجات التي في حالة pending أو rejected فقط
    if (product.approvalStatus === 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete approved products. Please contact admin.',
        messageAr: 'لا يمكن حذف المنتجات المعتمدة. يرجى التواصل مع الإدارة.'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      messageAr: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get supplier's product statistics
 * @route   GET /api/supplier/stats
 * @access  Supplier only
 */
exports.getMyStats = async (req, res) => {
  try {
    const supplierId = req.user._id;

    const totalProducts = await Product.countDocuments({ supplier: supplierId });
    const approvedProducts = await Product.countDocuments({
      supplier: supplierId,
      approvalStatus: 'approved'
    });
    const pendingProducts = await Product.countDocuments({
      supplier: supplierId,
      approvalStatus: 'pending'
    });
    const rejectedProducts = await Product.countDocuments({
      supplier: supplierId,
      approvalStatus: 'rejected'
    });

    // إحصائيات حسب القسم
    const productsByCategory = await Product.aggregate([
      { $match: { supplier: supplierId } },
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] }
        }
      }},
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        rejectedProducts,
        productsByCategory,
        allowedCategories: req.user.managedCategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approve supplier's product (Super Admin only)
 * @route   PUT /api/admin/products/:id/approve
 * @access  Super Admin only
 */
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        messageAr: 'المنتج غير موجود'
      });
    }

    if (product.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Product is already approved',
        messageAr: 'المنتج معتمد مسبقاً'
      });
    }

    product.approvalStatus = 'approved';
    product.approvedAt = Date.now();
    product.approvedBy = req.user._id;
    product.isActive = true; // تفعيل المنتج
    product.rejectionReason = undefined;

    await product.save();

    // تحديث عدد المنتجات الموردة للمورد
    await User.findByIdAndUpdate(product.supplier, {
      $inc: { totalSupplied: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      messageAr: 'تم اعتماد المنتج بنجاح',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Reject supplier's product (Super Admin only)
 * @route   PUT /api/admin/products/:id/reject
 * @access  Super Admin only
 */
exports.rejectProduct = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
        messageAr: 'سبب الرفض مطلوب'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        messageAr: 'المنتج غير موجود'
      });
    }

    product.approvalStatus = 'rejected';
    product.rejectionReason = rejectionReason;
    product.isActive = false;
    product.approvedAt = undefined;
    product.approvedBy = undefined;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product rejected successfully',
      messageAr: 'تم رفض المنتج بنجاح',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all pending products (Super Admin only)
 * @route   GET /api/admin/products/pending
 * @access  Super Admin only
 */
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ approvalStatus: 'pending' })
      .populate('supplier', 'name companyName supplierCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all products by approval status (Super Admin only)
 * @route   GET /api/admin/products/by-status/:status
 * @access  Super Admin only
 */
exports.getProductsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, or rejected',
        messageAr: 'حالة غير صحيحة. يجب أن تكون: pending, approved, أو rejected'
      });
    }

    const products = await Product.find({ approvalStatus: status })
      .populate('supplier', 'name companyName supplierCode')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
