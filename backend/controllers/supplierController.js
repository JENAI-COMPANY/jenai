const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
exports.getSuppliers = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: suppliers.length,
      suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('products', 'name price');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create supplier (creates a user account with supplier role)
// @route   POST /api/suppliers
// @access  Private/SuperAdmin
exports.createSupplier = async (req, res) => {
  try {
    const User = require('../models/User');
    const {
      username,
      password,
      name,
      companyName,
      phone,
      email,
      country,
      city,
      address,
      taxNumber,
      category,
      paymentTerms,
      managedCategories,
      notes
    } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Generate supplier code
    const supplierCode = await User.generateSupplierCode();

    // Create user account with supplier role
    const supplierUser = await User.create({
      username: username.toLowerCase(),
      password,
      name,
      role: 'supplier',
      phone,
      country,
      city,
      companyName,
      taxNumber,
      supplierCategory: category,
      paymentTerms,
      supplierCode,
      managedCategories: managedCategories || []
    });

    // Also create in Supplier collection for backward compatibility
    const supplier = await Supplier.create({
      name,
      companyName,
      phone,
      email,
      country,
      city,
      address,
      taxNumber,
      category,
      paymentTerms,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب المورد بنجاح',
      supplier: {
        ...supplier.toObject(),
        username: supplierUser.username,
        supplierCode: supplierUser.supplierCode,
        managedCategories: supplierUser.managedCategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      supplier: updatedSupplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Super Admin
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.deleteOne();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle supplier status
// @route   PUT /api/suppliers/:id/status
// @access  Private/Admin
exports.toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update supplier rating
// @route   PUT /api/suppliers/:id/rating
// @access  Private/Admin
exports.updateSupplierRating = async (req, res) => {
  try {
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { rating },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
