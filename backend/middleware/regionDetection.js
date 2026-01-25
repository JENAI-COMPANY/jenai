const Region = require('../models/Region');
const User = require('../models/User');

/**
 * Middleware لتحديد الفرع من رابط الإحالة أو من بيانات المستخدم
 *
 * يمكن تحديد الفرع بعدة طرق:
 * 1. من query parameter: ?region=GZA أو ?regionId=123
 * 2. من رابط الإحالة: ?ref=PS123456 (من كود العضو)
 * 3. من المستخدم المسجل دخوله
 * 4. من session/cookie
 */
exports.detectRegion = async (req, res, next) => {
  try {
    let detectedRegion = null;

    // 1. التحقق من وجود regionCode في query
    if (req.query.region) {
      detectedRegion = await Region.findOne({
        code: req.query.region.toUpperCase(),
        isActive: true
      });
    }

    // 2. التحقق من وجود regionId في query
    if (!detectedRegion && req.query.regionId) {
      detectedRegion = await Region.findById(req.query.regionId);
    }

    // 3. التحقق من رابط الإحالة (referral code)
    if (!detectedRegion && req.query.ref) {
      const referralUser = await User.findOne({
        subscriberCode: req.query.ref.toUpperCase()
      }).populate('region');

      if (referralUser && referralUser.region) {
        detectedRegion = referralUser.region;
      }
    }

    // 4. التحقق من المستخدم المسجل دخوله
    if (!detectedRegion && req.user && req.user.region) {
      detectedRegion = await Region.findById(req.user.region);
    }

    // 5. التحقق من session/cookie (إذا كان موجود)
    if (!detectedRegion && req.session && req.session.regionId) {
      detectedRegion = await Region.findById(req.session.regionId);
    }

    // 6. التحقق من cookie
    if (!detectedRegion && req.cookies && req.cookies.regionCode) {
      detectedRegion = await Region.findOne({
        code: req.cookies.regionCode.toUpperCase(),
        isActive: true
      });
    }

    // إرفاق الفرع المكتشف بالـ request
    if (detectedRegion) {
      req.detectedRegion = detectedRegion;
      req.regionId = detectedRegion._id;
      req.regionCode = detectedRegion.code;
    }

    next();
  } catch (error) {
    console.error('Region detection error:', error);
    // لا نوقف العملية في حالة الخطأ، فقط نكمل بدون فرع
    next();
  }
};

/**
 * Middleware لحفظ الفرع في session/cookie
 */
exports.saveRegionToSession = (req, res, next) => {
  try {
    if (req.detectedRegion) {
      // حفظ في session
      if (req.session) {
        req.session.regionId = req.detectedRegion._id.toString();
        req.session.regionCode = req.detectedRegion.code;
      }

      // حفظ في cookie (30 يوم)
      res.cookie('regionCode', req.detectedRegion.code, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
    }

    next();
  } catch (error) {
    console.error('Save region to session error:', error);
    next();
  }
};

/**
 * Middleware للتأكد من وجود فرع (اختياري)
 */
exports.requireRegion = (req, res, next) => {
  if (!req.detectedRegion && !req.regionId) {
    return res.status(400).json({
      success: false,
      message: 'Region not specified. Please provide region code or use a referral link.'
    });
  }

  next();
};
