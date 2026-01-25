const Region = require('../models/Region');
const User = require('../models/User');
const Product = require('../models/Product');

// إنشاء فرع جديد
exports.createRegion = async (req, res) => {
  try {
    console.log('=== Creating region ===');
    console.log('Request body:', req.body);

    const { name, nameAr, nameEn, code, description, regionalAdmin, settings, contactInfo } = req.body;

    // التحقق من عدم وجود فرع بنفس الكود
    const existingRegion = await Region.findOne({ code: code.toUpperCase() });
    if (existingRegion) {
      return res.status(400).json({ message: 'Region code already exists' });
    }

    // إنشاء الفرع
    const region = await Region.create({
      name,
      nameAr,
      nameEn,
      code: code.toUpperCase(),
      description,
      regionalAdmin,
      settings,
      contactInfo
    });

    // تحديث المسؤول الإقليمي إذا تم تحديده
    if (regionalAdmin) {
      await User.findByIdAndUpdate(regionalAdmin, {
        region: region._id,
        $addToSet: { managedRegions: region._id }
      });
    }

    res.status(201).json({
      success: true,
      region
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على جميع الفروع
exports.getAllRegions = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const regions = await Region.find(filter)
      .populate('regionalAdmin', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: regions.length,
      regions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على فرع واحد
exports.getRegionById = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id)
      .populate('regionalAdmin', 'name email phone');

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // إحصائيات الفرع
    const members = await User.countDocuments({ region: region._id });
    const products = await Product.countDocuments({ region: region._id });

    res.status(200).json({
      success: true,
      region: {
        ...region.toObject(),
        stats: {
          ...region.stats,
          totalMembers: members,
          totalProducts: products
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على فرع بواسطة الكود
exports.getRegionByCode = async (req, res) => {
  try {
    const region = await Region.findOne({ code: req.params.code.toUpperCase() })
      .populate('regionalAdmin', 'name email phone');

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    res.status(200).json({
      success: true,
      region
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث فرع
exports.updateRegion = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const {
      name,
      nameAr,
      nameEn,
      code,
      description,
      regionalAdmin,
      isActive,
      settings,
      contactInfo
    } = req.body;

    // تحديث البيانات
    if (name) region.name = name;
    if (nameAr) region.nameAr = nameAr;
    if (nameEn) region.nameEn = nameEn;
    if (code) region.code = code.toUpperCase();
    if (description !== undefined) region.description = description;
    if (isActive !== undefined) region.isActive = isActive;
    if (settings) region.settings = { ...region.settings, ...settings };
    if (contactInfo) region.contactInfo = { ...region.contactInfo, ...contactInfo };

    // تحديث المسؤول الإقليمي
    if (regionalAdmin && regionalAdmin !== region.regionalAdmin?.toString()) {
      // إزالة الفرع من المسؤول القديم
      if (region.regionalAdmin) {
        await User.findByIdAndUpdate(region.regionalAdmin, {
          $pull: { managedRegions: region._id }
        });
      }

      // إضافة الفرع للمسؤول الجديد
      await User.findByIdAndUpdate(regionalAdmin, {
        region: region._id,
        $addToSet: { managedRegions: region._id }
      });

      region.regionalAdmin = regionalAdmin;
    }

    const updatedRegion = await region.save();

    res.status(200).json({
      success: true,
      region: updatedRegion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// حذف فرع
exports.deleteRegion = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // التحقق من عدم وجود مستخدمين أو منتجات مرتبطة
    const usersCount = await User.countDocuments({ region: region._id });
    const productsCount = await Product.countDocuments({ region: region._id });

    if (usersCount > 0 || productsCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete region with associated users or products',
        usersCount,
        productsCount
      });
    }

    await region.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Region deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على منتجات فرع معين
exports.getRegionProducts = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // البحث عن المنتجات الخاصة بالفرع أو المنتجات العامة
    const products = await Product.find({
      $or: [
        { region: region._id, isActive: true },
        { isGlobal: true, isActive: true },
        { 'regionalPricing.region': region._id, 'regionalPricing.isActive': true }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على أعضاء فرع معين
exports.getRegionMembers = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const members = await User.find({ region: region._id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث إحصائيات الفرع
exports.updateRegionStats = async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const Order = require('../models/Order');

    // حساب الإحصائيات
    const totalMembers = await User.countDocuments({ region: region._id });
    const totalProducts = await Product.countDocuments({ region: region._id });
    const orders = await Order.find({ region: region._id });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    region.totalMembers = totalMembers;
    region.stats.totalOrders = totalOrders;
    region.stats.totalRevenue = totalRevenue;
    region.stats.totalProducts = totalProducts;

    await region.save();

    res.status(200).json({
      success: true,
      region
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
