const User = require('../models/User');
const Product = require('../models/Product');

/**
 * @desc    Get all suppliers
 * @route   GET /api/suppliers
 * @access  Super Admin only
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const { isActive, search, category } = req.query;
    let query = { role: 'supplier' };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      query.managedCategories = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // حساب إحصائيات كل مورد
    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier) => {
        const totalProducts = await Product.countDocuments({ supplier: supplier._id });
        const approvedProducts = await Product.countDocuments({
          supplier: supplier._id,
          approvalStatus: 'approved'
        });
        const pendingProducts = await Product.countDocuments({
          supplier: supplier._id,
          approvalStatus: 'pending'
        });
        const rejectedProducts = await Product.countDocuments({
          supplier: supplier._id,
          approvalStatus: 'rejected'
        });

        return {
          ...supplier.toObject(),
          stats: {
            totalProducts,
            approvedProducts,
            pendingProducts,
            rejectedProducts
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: suppliersWithStats.length,
      suppliers: suppliersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single supplier by ID
 * @route   GET /api/suppliers/:id
 * @access  Super Admin only
 */
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await User.findOne({
      _id: req.params.id,
      role: 'supplier'
    }).select('-password');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    // الحصول على إحصائيات المورد
    const totalProducts = await Product.countDocuments({ supplier: supplier._id });
    const approvedProducts = await Product.countDocuments({
      supplier: supplier._id,
      approvalStatus: 'approved'
    });
    const pendingProducts = await Product.countDocuments({
      supplier: supplier._id,
      approvalStatus: 'pending'
    });
    const rejectedProducts = await Product.countDocuments({
      supplier: supplier._id,
      approvalStatus: 'rejected'
    });

    // الحصول على منتجات المورد
    const products = await Product.find({ supplier: supplier._id })
      .select('name category approvalStatus createdAt images customerPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      supplier: {
        ...supplier.toObject(),
        stats: {
          totalProducts,
          approvedProducts,
          pendingProducts,
          rejectedProducts
        },
        products
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
 * @desc    Create new supplier
 * @route   POST /api/suppliers
 * @access  Super Admin only
 */
exports.createSupplier = async (req, res) => {
  try {
    const {
      username,
      name,
      password,
      companyName,
      taxNumber,
      supplierCategory,
      managedCategories,
      phone,
      country,
      city,
      address,
      paymentTerms
    } = req.body;

    // التحقق من عدم وجود username مسبقاً
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
        messageAr: 'اسم المستخدم موجود مسبقاً'
      });
    }

    // توليد كود المورد
    const supplierCode = await User.generateSupplierCode();

    // إنشاء المورد
    const supplier = await User.create({
      username: username.toLowerCase(),
      name,
      password,
      role: 'supplier',
      supplierCode,
      companyName,
      taxNumber,
      supplierCategory,
      managedCategories: managedCategories || [],
      phone,
      country,
      city,
      address,
      paymentTerms: paymentTerms || 'Net 30',
      supplierRating: 5
    });

    // إزالة كلمة المرور من الاستجابة
    supplier.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      messageAr: 'تم إنشاء المورد بنجاح',
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Super Admin only
 */
exports.updateSupplier = async (req, res) => {
  try {
    const {
      name,
      companyName,
      taxNumber,
      supplierCategory,
      managedCategories,
      phone,
      country,
      city,
      address,
      paymentTerms,
      supplierRating,
      isActive
    } = req.body;

    const supplier = await User.findOne({
      _id: req.params.id,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    // تحديث الحقول
    if (name) supplier.name = name;
    if (companyName) supplier.companyName = companyName;
    if (taxNumber) supplier.taxNumber = taxNumber;
    if (supplierCategory) supplier.supplierCategory = supplierCategory;
    if (managedCategories) supplier.managedCategories = managedCategories;
    if (phone) supplier.phone = phone;
    if (country) supplier.country = country;
    if (city) supplier.city = city;
    if (address) supplier.address = address;
    if (paymentTerms) supplier.paymentTerms = paymentTerms;
    if (supplierRating !== undefined) supplier.supplierRating = supplierRating;
    if (isActive !== undefined) supplier.isActive = isActive;

    await supplier.save();

    // إزالة كلمة المرور من الاستجابة
    supplier.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      messageAr: 'تم تحديث المورد بنجاح',
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update supplier's managed categories (الأقسام المسموح بها)
 * @route   PUT /api/suppliers/:id/categories
 * @access  Super Admin only
 */
exports.updateSupplierCategories = async (req, res) => {
  try {
    const { managedCategories } = req.body;

    if (!managedCategories || !Array.isArray(managedCategories)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide managed categories as an array',
        messageAr: 'يرجى توفير الأقسام المسموح بها كمصفوفة'
      });
    }

    const supplier = await User.findOne({
      _id: req.params.id,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    supplier.managedCategories = managedCategories;
    await supplier.save();

    supplier.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Supplier categories updated successfully',
      messageAr: 'تم تحديث أقسام المورد بنجاح',
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Toggle supplier status (active/inactive)
 * @route   PUT /api/suppliers/:id/toggle-status
 * @access  Super Admin only
 */
exports.toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await User.findOne({
      _id: req.params.id,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    supplier.password = undefined;

    res.status(200).json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      messageAr: `تم ${supplier.isActive ? 'تفعيل' : 'تعطيل'} المورد بنجاح`,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Super Admin only
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await User.findOne({
      _id: req.params.id,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    // التحقق من وجود منتجات للمورد
    const productsCount = await Product.countDocuments({ supplier: supplier._id });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${productsCount} products. Please delete or reassign products first.`,
        messageAr: `لا يمكن حذف المورد لوجود ${productsCount} منتج. يرجى حذف أو إعادة تعيين المنتجات أولاً.`
      });
    }

    await supplier.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      messageAr: 'تم حذف المورد بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get supplier's products
 * @route   GET /api/suppliers/:id/products
 * @access  Super Admin, Supplier (own products)
 */
exports.getSupplierProducts = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // التحقق من الصلاحيات: Super Admin أو المورد نفسه
    if (req.user.role !== 'super_admin' && req.user._id.toString() !== supplierId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these products',
        messageAr: 'غير مصرح لك بعرض هذه المنتجات'
      });
    }

    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    // فلترة حسب حالة الموافقة (اختياري)
    const { approvalStatus } = req.query;
    const filter = { supplier: supplierId };

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
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
 * @desc    Get supplier statistics
 * @route   GET /api/suppliers/:id/stats
 * @access  Super Admin, Supplier (own stats)
 */
exports.getSupplierStats = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // التحقق من الصلاحيات
    if (req.user.role !== 'super_admin' && req.user._id.toString() !== supplierId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these statistics',
        messageAr: 'غير مصرح لك بعرض هذه الإحصائيات'
      });
    }

    const supplier = await User.findOne({
      _id: supplierId,
      role: 'supplier'
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        messageAr: 'المورد غير موجود'
      });
    }

    // إحصائيات المنتجات
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
    const activeProducts = await Product.countDocuments({
      supplier: supplierId,
      isActive: true,
      approvalStatus: 'approved'
    });

    // إحصائيات حسب القسم
    const productsByCategory = await Product.aggregate([
      { $match: { supplier: supplier._id } },
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
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
        activeProducts,
        productsByCategory,
        supplierInfo: {
          name: supplier.name,
          companyName: supplier.companyName,
          supplierCode: supplier.supplierCode,
          managedCategories: supplier.managedCategories,
          rating: supplier.supplierRating,
          totalSupplied: supplier.totalSupplied
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
