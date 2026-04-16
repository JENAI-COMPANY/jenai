const Product = require('../models/Product');

// Helper function to calculate discount percentage
const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Helper function to process discount data
const processDiscountData = (productData) => {
  let hasAnyDiscount = false;

  // معالجة خصم الزباين (العملاء)
  if (productData.customerDiscount?.enabled &&
      productData.customerDiscount?.originalPrice &&
      productData.customerDiscount?.discountedPrice) {

    const originalPrice = parseFloat(productData.customerDiscount.originalPrice);
    const discountedPrice = parseFloat(productData.customerDiscount.discountedPrice);

    productData.customerDiscount.discountPercentage = calculateDiscountPercentage(originalPrice, discountedPrice);

    // لا نغير customerPrice - نحتفظ بالسعر الأصلي
    // السعر المخفض موجود في customerDiscount.discountedPrice
    hasAnyDiscount = true;
  } else {
    productData.customerDiscount = {
      enabled: false,
      originalPrice: productData.customerPrice || 0,
      discountedPrice: productData.customerPrice || 0,
      discountPercentage: 0
    };
  }

  // معالجة خصم الأعضاء
  if (productData.subscriberDiscount?.enabled &&
      productData.subscriberDiscount?.originalPrice &&
      productData.subscriberDiscount?.discountedPrice) {

    const originalPrice = parseFloat(productData.subscriberDiscount.originalPrice);
    const discountedPrice = parseFloat(productData.subscriberDiscount.discountedPrice);

    productData.subscriberDiscount.discountPercentage = calculateDiscountPercentage(originalPrice, discountedPrice);

    // لا نغير subscriberPrice - نحتفظ بالسعر الأصلي
    // السعر المخفض موجود في subscriberDiscount.discountedPrice
    hasAnyDiscount = true;
  } else {
    productData.subscriberDiscount = {
      enabled: false,
      originalPrice: productData.subscriberPrice || 0,
      discountedPrice: productData.subscriberPrice || 0,
      discountPercentage: 0
    };
  }

  // تحديث حالة الخصم العامة
  productData.hasDiscount = hasAnyDiscount;

  // تحديث حالة نفاد المخزون
  if (productData.stock !== undefined) {
    productData.isOutOfStock = productData.stock === 0;
  }

  return productData;
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, regionId, regionCode, isNewArrival, isOffer } = req.query;

    console.log('📋 Query parameters received:', { category, search, regionId, regionCode, isNewArrival, isOffer });

    // المدراء يرون جميع المنتجات (نشطة وغير نشطة)، المستخدمون العاديون يرون النشطة فقط
    const adminRoles = ['super_admin', 'regional_admin', 'category_admin'];
    const isAdminRequest = req.user && adminRoles.includes(req.user.role);
    const query = isAdminRequest ? {} : { isActive: true };

    if (category) {
      query.category = category;
    }

    // فلترة حسب "وصل حديثاً"
    if (isNewArrival === 'true' || isNewArrival === true) {
      query.isNewArrival = true;
      console.log('✅ Filtering by isNewArrival');
    }

    // فلترة حسب "العروض"
    if (isOffer === 'true' || isOffer === true) {
      query.isOffer = true;
      console.log('✅ Filtering by isOffer');
    }

    // فلترة تلقائية لمدير المنطقة - يرى فقط منتجات منطقته
    if (req.user && req.user.role === 'regional_admin' && req.user.region) {
      const adminRegionId = req.user.region._id || req.user.region;
      query.region = adminRegionId;
      console.log('🔒 Regional admin filter: Only products from region', adminRegionId);
    }

    // فلترة تلقائية لمدير القسم - يرى فقط منتجات أقسامه
    if (req.user && req.user.role === 'category_admin') {
      // Check if category admin has permission to view products
      if (!req.user.permissions || !req.user.permissions.canViewProducts) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view products.',
          messageAr: 'غير مصرح. ليس لديك صلاحية لعرض المنتجات.'
        });
      }

      if (!req.user.managedCategories || req.user.managedCategories.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No categories assigned to your account',
          messageAr: 'لا توجد أقسام مخصصة لحسابك'
        });
      }
      query.category = { $in: req.user.managedCategories };
      console.log('🔒 Category admin filter: Only products from categories', req.user.managedCategories);
    }

    // فلترة اختيارية حسب المنطقة (فقط للمستخدمين غير regional_admin أو category_admin)
    if ((regionId || regionCode) && !(req.user && (req.user.role === 'regional_admin' || req.user.role === 'category_admin'))) {
      let region;

      if (regionCode && typeof regionCode === 'string') {
        const Region = require('../models/Region');
        region = await Region.findOne({ code: regionCode.toUpperCase() });
      } else if (regionId) {
        region = { _id: regionId };
      } else if (userRegionId) {
        region = { _id: userRegionId };
        console.log('🔍 Filtering by user region:', userRegionId);
      }

      if (region) {
        // بناء شروط الفرع الأساسية
        // يظهر: منتجات المنطقة + المنتجات العامة فقط
        const regionConditions = [
          { region: region._id, isActive: true }, // منتجات المنطقة المحددة
          { isGlobal: true, isActive: true } // المنتجات العامة لجميع المناطق
        ];

        // إذا كان هناك فئة محددة، نضيفها لكل شرط
        if (category) {
          query.$or = regionConditions.map(condition => ({
            ...condition,
            category: category
          }));
          delete query.category; // حذف category من الشروط الأساسية لأننا أضفناها في $or
        } else {
          query.$or = regionConditions;
        }
      }
    }

    if (search) {
      // إذا كان هناك $or موجود مسبقاً (بسبب فلترة الفروع)، نستخدم $and
      if (query.$or) {
        const previousOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: previousOr },
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      } else {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const products = await Product.find(query)
      .populate('region', 'name nameAr code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // إذا كان هناك فرع محدد، نعيد الأسعار الخاصة بهذا الفرع
    let regionSpecificProducts = products;
    if (regionId || regionCode) {
      regionSpecificProducts = products.map(product => {
        const productObj = product.toObject();

        // البحث عن الأسعار الخاصة بهذا الفرع
        const regionalPricing = productObj.regionalPricing?.find(
          rp => rp.region.toString() === (regionId || region._id.toString())
        );

        if (regionalPricing) {
          // استبدال الأسعار بالأسعار الخاصة بالفرع
          productObj.customerPrice = regionalPricing.customerPrice || productObj.customerPrice;
          productObj.memberPrice = regionalPricing.memberPrice || productObj.memberPrice;
          productObj.wholesalePrice = regionalPricing.wholesalePrice || productObj.wholesalePrice;
          productObj.bulkPrice = regionalPricing.bulkPrice || productObj.bulkPrice;
          productObj.stock = regionalPricing.stock !== undefined ? regionalPricing.stock : productObj.stock;
        }

        return productObj;
      });
    }

    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products: regionSpecificProducts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('region', 'name nameAr nameEn code');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    console.log('Request files:', req.files);

    let productData = { ...req.body };

    // Clean up FormData - convert string 'undefined' to undefined
    // Don't delete required fields like name, description, etc.
    const optionalFields = ['bulkPrice', 'bulkMinQuantity', 'points', 'supplier', 'region'];
    Object.keys(productData).forEach(key => {
      if (productData[key] === 'undefined' || productData[key] === 'null') {
        delete productData[key];
      }
      // Only delete empty strings for optional fields
      if (productData[key] === '' && optionalFields.includes(key)) {
        delete productData[key];
      }
    });

    // Normalize colors and sizes: multer may send a string if only one value
    if (productData.colors && !Array.isArray(productData.colors)) {
      productData.colors = [productData.colors];
    }
    if (productData.sizes && !Array.isArray(productData.sizes)) {
      productData.sizes = [productData.sizes];
    }

    // Parse JSON strings from FormData
    if (typeof productData.customerDiscount === 'string') {
      try {
        productData.customerDiscount = JSON.parse(productData.customerDiscount);
      } catch (e) {
        console.error('Error parsing customerDiscount:', e);
      }
    }

    if (typeof productData.subscriberDiscount === 'string') {
      try {
        productData.subscriberDiscount = JSON.parse(productData.subscriberDiscount);
      } catch (e) {
        console.error('Error parsing subscriberDiscount:', e);
      }
    }

    // التحقق من المنطقة حسب دور المستخدم
    console.log('User role:', req.user.role);
    console.log('Product region before:', productData.region);

    if (req.user.role === 'regional_admin') {
      // إذا كان admin المنطقة، المنتج يُضاف تلقائياً لمنطقته
      if (!req.user.region) {
        return res.status(400).json({
          message: 'Regional admin must have a region assigned',
          messageAr: 'يجب أن يكون لدى مدير المنطقة منطقة محددة'
        });
      }
      productData.region = req.user.region;
      productData.isGlobal = false;
    } else if (req.user.role === 'super_admin') {
      // super_admin يختار المنطقة أو يجعلها عامة للجميع
      if (productData.region && productData.region !== 'all') {
        // منتج لمنطقة محددة
        productData.isGlobal = false;
      } else {
        // منتج عام للجميع
        productData.region = null;
        productData.isGlobal = true;
      }
    }

    console.log('Product region after:', productData.region);
    console.log('Product isGlobal:', productData.isGlobal);

    // معالجة بيانات الخصم
    productData = processDiscountData(productData);

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      productData.media = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        filename: file.filename
      }));

      // Set first image as main image for backward compatibility
      if (productData.media.length > 0 && productData.media[0].type === 'image') {
        productData.images = [productData.media[0].url];
      }
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    let productData = { ...req.body };

    // Clean up FormData - convert string 'undefined' to undefined
    const optionalFields = ['bulkPrice', 'bulkMinQuantity', 'points', 'supplier', 'region'];
    Object.keys(productData).forEach(key => {
      if (productData[key] === 'undefined' || productData[key] === 'null') {
        delete productData[key];
      }
      // Only delete empty strings for optional fields
      if (productData[key] === '' && optionalFields.includes(key)) {
        delete productData[key];
      }
    });

    // Normalize colors and sizes: multer may send a string if only one value
    if (productData.colors && !Array.isArray(productData.colors)) {
      productData.colors = [productData.colors];
    }
    if (productData.sizes && !Array.isArray(productData.sizes)) {
      productData.sizes = [productData.sizes];
    }

    // Parse JSON strings from FormData
    if (typeof productData.customerDiscount === 'string') {
      try {
        productData.customerDiscount = JSON.parse(productData.customerDiscount);
      } catch (e) {
        console.error('Error parsing customerDiscount:', e);
      }
    }

    if (typeof productData.subscriberDiscount === 'string') {
      try {
        productData.subscriberDiscount = JSON.parse(productData.subscriberDiscount);
      } catch (e) {
        console.error('Error parsing subscriberDiscount:', e);
      }
    }

    // معالجة بيانات الخصم
    productData = processDiscountData(productData);

    // التحقق من صلاحيات تعديل المنطقة
    if (req.user.role === 'regional_admin') {
      // regional_admin لا يمكنه تغيير المنطقة
      // نحذف حقل المنطقة من البيانات المرسلة لتجنب تغييرها
      delete productData.region;
    } else if (req.user.role === 'super_admin' && productData.region) {
      // super_admin يمكنه تغيير المنطقة
      if (productData.region === 'all') {
        productData.region = null;
        productData.isGlobal = true;
      } else {
        productData.isGlobal = false;
      }
    }

    // Get existing product first
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // معالجة حذف الصور
    let updatedMedia = existingProduct.media || [];

    // إذا كان هناك صور محددة للحذف
    if (req.body.mediaToDelete) {
      try {
        const mediaToDelete = typeof req.body.mediaToDelete === 'string'
          ? JSON.parse(req.body.mediaToDelete)
          : req.body.mediaToDelete;

        if (Array.isArray(mediaToDelete) && mediaToDelete.length > 0) {
          // حذف الصور المحددة من القائمة
          updatedMedia = updatedMedia.filter(media => !mediaToDelete.includes(media.url));

          // حذف الملفات الفعلية من السيرفر
          const fs = require('fs').promises;
          const path = require('path');
          for (const url of mediaToDelete) {
            try {
              const filePath = path.join(__dirname, '..', url);
              await fs.unlink(filePath);
              console.log(`✅ تم حذف الملف: ${filePath}`);
            } catch (err) {
              console.error(`❌ فشل حذف الملف: ${url}`, err.message);
            }
          }
        }
      } catch (err) {
        console.error('Error processing mediaToDelete:', err);
      }
    }

    // Handle uploaded files (الصور الجديدة)
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        filename: file.filename
      }));

      // إضافة الصور الجديدة للصور الموجودة
      updatedMedia = [...updatedMedia, ...newMedia];
    }

    // تحديث الصور في البيانات
    productData.media = updatedMedia;

    // Set first image as main image for backward compatibility
    if (updatedMedia.length > 0) {
      const firstImage = updatedMedia.find(m => m.type === 'image');
      if (firstImage) {
        productData.images = [firstImage.url];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
