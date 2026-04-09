const express = require('express');
const router = express.Router();
const { protect, authorize, isSuperAdmin, isRegionalAdmin, isAdmin, isSalesEmployee } = require('../middleware/auth');
const {
  checkPermission,
  checkRegionalAccess,
  checkCategoryAccess,
  canViewMembers,
  canManageMembers,
  canViewProducts,
  canManageProducts,
  canViewOrders,
  canManageOrders
} = require('../middleware/permissions');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProfitPeriod = require('../models/ProfitPeriod');
const Reward = require('../models/Reward');
const PointTransaction = require('../models/PointTransaction');
const { adminUpdateOrder } = require('../controllers/orderController');
const {
  MEMBER_RANKS,
  calculateCumulativePoints,
  countBronzeLines,
  updateMemberRank,
  updateAllMembersRanks,
  getRankInfo,
  getNextRankRequirements,
  getAllRanks,
  getDownlineStructure,
  calculateDownlineCommission
} = require('../config/memberRanks');

// ══════════════════════════════════════════════════════════════
// دالة توزيع العمولات حسب النظام الجديد
// ══════════════════════════════════════════════════════════════
const distributeCommissions = async (buyer, productPoints, sourceType = 'order', description = '') => {
  try {
    // النسب الثابتة لعمولة الأجيال (للجميع)
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02]; // 11%, 8%, 6%, 3%, 2%

    // نسب عمولة القيادة حسب الرتبة
    const LEADERSHIP_RATES = {
      'agent': [],
      'bronze': [0.05], // جيل 1 فقط
      'gold': [0.05, 0.04], // جيل 1+2
      'silver': [0.05, 0.04, 0.03], // جيل 1+2+3
      'ruby': [0.05, 0.04, 0.03, 0.02], // جيل 1+2+3+4
      'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // الخمسة
      'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
      'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
    };

    // معامل التحويل من نقاط إلى شيكل
    const POINTS_TO_CURRENCY = 0.55;

    // ══════════════════════════════════════
    // 1. الربح الشخصي للمشتري (20%)
    // ══════════════════════════════════════
    const personalPoints = productPoints * 0.20;
    // حذف الأعشار من كل عملية حساب فردية
    const personalProfit = Math.floor(personalPoints * POINTS_TO_CURRENCY);

    buyer.points = (buyer.points || 0) + productPoints;
    buyer.monthlyPoints = (buyer.monthlyPoints || 0) + productPoints;
    buyer.totalCommission = (buyer.totalCommission || 0) + personalProfit;
    buyer.availableCommission = (buyer.availableCommission || 0) + personalProfit;
    await buyer.save();

    // تسجيل معاملة النقاط الشخصية
    try {
      await PointTransaction.create({
        memberId: buyer._id,
        points: productPoints,
        type: 'personal',
        sourceType: sourceType,
        description: description,
        earnedAt: new Date()
      });
    } catch (ptErr) {
      console.error('PointTransaction record failed (non-critical):', ptErr.message);
    }

    console.log(`💰 ${buyer.name} (المشتري) - نقاط: ${productPoints}, ربح شخصي: ${personalProfit} شيكل`);

    // ══════════════════════════════════════
    // 2. توزيع على الأجيال الخمسة
    // ══════════════════════════════════════
    let currentMemberId = buyer.referredBy;
    let generationLevel = 0;

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') break;

      // عمولة الأجيال (ثابتة)
      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = productPoints * genRate;

      // عمولة القيادة (حسب الرتبة)
      const leadershipRates = LEADERSHIP_RATES[currentMember.memberRank] || [];
      const leadershipRate = leadershipRates[generationLevel] || 0;
      const leadershipPoints = productPoints * leadershipRate;

      // حذف الأعشار من كل عملية حساب فردية
      const genProfit = Math.floor(genPoints * POINTS_TO_CURRENCY);
      const leadershipProfit = Math.floor(leadershipPoints * POINTS_TO_CURRENCY);
      const profit = genProfit + leadershipProfit;

      // تحديث العضو
      const genFieldName = `generation${generationLevel + 1}Points`;
      currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;

      // تحديث النقاط التراكمية (points) - كاملة بدون نسبة
      currentMember.points = (currentMember.points || 0) + productPoints; // النقاط الكاملة بدون نسبة

      if (leadershipPoints > 0) {
        currentMember.leadershipPoints = (currentMember.leadershipPoints || 0) + leadershipPoints;
        // نقاط القيادة أيضاً تُضاف كاملة
        currentMember.points = (currentMember.points || 0) + leadershipPoints;
      }

      currentMember.totalCommission = (currentMember.totalCommission || 0) + profit;
      currentMember.availableCommission = (currentMember.availableCommission || 0) + profit;

      await currentMember.save();

      // تسجيل معاملة نقاط الأجيال
      try {
        await PointTransaction.create({
          memberId: currentMember._id,
          points: genPoints,
          type: `generation${generationLevel + 1}`,
          sourceType: sourceType,
          description: description,
          earnedAt: new Date()
        });
      } catch (ptErr) {
        console.error('PointTransaction record failed (non-critical):', ptErr.message);
      }

      console.log(`💰 ${currentMember.name} (جيل ${generationLevel + 1}) - عمولة أجيال: ${genProfit} شيكل (${genPoints.toFixed(2)} نقطة), عمولة قيادة: ${leadershipProfit} شيكل, نقاط تراكمية: +${productPoints.toFixed(2)} كامل`);

      // الانتقال للجيل التالي
      currentMemberId = currentMember.referredBy;
      generationLevel++;
    }
  } catch (error) {
    console.error('❌ خطأ في توزيع العمولات:', error);
  }
};

// ══════════════════════════════════════════════════════════════
// دالة توزيع نقاط الأجيال فقط (بدون عمولات)
// تُستخدم عند تعديل النقاط الشهرية عبر لوحة الأدمن
// ══════════════════════════════════════════════════════════════
const distributeGenerationPointsOnly = async (member, points) => {
  try {
    // النسب الثابتة لعمولة الأجيال
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02]; // 11%, 8%, 6%, 3%, 2%

    console.log(`📊 توزيع ${points} نقطة من ${member.name} على الأعضاء العلويين (نقاط الأجيال فقط)`);
    console.log(`🔍 referredBy: ${member.referredBy}, sponsorId: ${member.sponsorId}`);

    // استخدام referredBy أولاً، وإذا لم يكن موجوداً استخدم sponsorId
    let currentMemberId = member.referredBy || member.sponsorId;
    let generationLevel = 0;

    if (!currentMemberId) {
      console.log('⚠️ لا يوجد راعي لهذا العضو - لن يتم التوزيع');
      return;
    }

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember) {
        console.log(`⚠️ لم يتم العثور على العضو: ${currentMemberId}`);
        break;
      }

      if (currentMember.role !== 'member') {
        console.log(`⚠️ العضو ${currentMember.name} ليس member (role: ${currentMember.role})`);
        break;
      }

      // حساب نقاط الجيل (بالنسبة - للأرباح)
      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = points * genRate;

      const genFieldName = `generation${generationLevel + 1}Points`;
      const oldGenValue = currentMember[genFieldName] || 0;
      const oldPointsValue = currentMember.points || 0;

      if (points > 0) {
        // إضافة: نقاط الجيل + التراكمي
        currentMember[genFieldName] = oldGenValue + genPoints;
        currentMember.points = oldPointsValue + points;
      } else {
        // خصم: التراكمي فقط، نقاط الجيل لا تُخصم (الأرباح اتحسبت مسبقاً)
        currentMember.points = Math.max(0, oldPointsValue + points);
      }

      await currentMember.save();

      // تسجيل معاملة نقاط الأجيال
      try {
        await PointTransaction.create({
          memberId: currentMember._id,
          points: genPoints,
          type: `generation${generationLevel + 1}`,
          sourceType: 'admin_compensation',
          earnedAt: new Date()
        });
      } catch (ptErr) {
        console.error('PointTransaction record failed (non-critical):', ptErr.message);
      }

      console.log(`  └─ ${currentMember.name} (جيل ${generationLevel + 1}):`);
      console.log(`     - generation${generationLevel + 1}Points (للأرباح): من ${oldGenValue.toFixed(2)} إلى ${currentMember[genFieldName].toFixed(2)} (+${genPoints.toFixed(2)})`);
      console.log(`     - points (تراكمي): من ${oldPointsValue.toFixed(2)} إلى ${currentMember.points.toFixed(2)} (+${points.toFixed(2)} كامل)`);

      // تحديث الرتبة تلقائياً بعد تغيير النقاط
      try {
        const rankUpdate = await updateMemberRank(currentMember._id, User);
        if (rankUpdate.updated) {
          console.log(`     🎖️ الرتبة: ${rankUpdate.oldRank} → ${rankUpdate.newRank}`);
        }
      } catch (rankError) {
        console.error(`     ⚠️ خطأ في تحديث الرتبة: ${rankError.message}`);
      }

      // الانتقال للجيل التالي
      currentMemberId = currentMember.referredBy || currentMember.sponsorId;
      generationLevel++;
    }

    console.log(`✅ تم توزيع النقاط على ${generationLevel} جيل`);
  } catch (error) {
    console.error('❌ خطأ في توزيع نقاط الأجيال:', error);
  }
};

// ══════════════════════════════════════════════════════════════
// توزيع النقاط التراكمية فقط على الأعضاء العلويين (5 أجيال)
// تُستخدم عند تعديل النقاط التراكمية (points) مباشرة من لوحة الأدمن
// لا تُضاف نقاط أداء شخصي ولا عمولات، فقط التراكمي
// ══════════════════════════════════════════════════════════════
const distributeCumulativePointsToUpline = async (member, pointsDiff) => {
  try {
    if (!pointsDiff || pointsDiff === 0) return;

    let currentMemberId = member.referredBy || member.sponsorId;
    let generationLevel = 0;

    if (!currentMemberId) {
      console.log('⚠️ لا يوجد راعي لهذا العضو - لن يتم توزيع النقاط التراكمية');
      return;
    }

    console.log(`📊 توزيع ${pointsDiff} نقطة تراكمية من ${member.name} على الأعضاء العلويين`);

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') break;

      const oldPoints = currentMember.points || 0;
      currentMember.points = oldPoints + pointsDiff;
      await currentMember.save();

      console.log(`  └─ ${currentMember.name} (جيل ${generationLevel + 1}): ${oldPoints} → ${currentMember.points}`);

      // تحديث الرتبة تلقائياً
      try {
        await updateMemberRank(currentMember._id, User);
      } catch (e) {}

      currentMemberId = currentMember.referredBy || currentMember.sponsorId;
      generationLevel++;
    }

    console.log(`✅ تم توزيع النقاط التراكمية على ${generationLevel} جيل`);
  } catch (error) {
    console.error('❌ خطأ في توزيع النقاط التراكمية:', error);
  }
};

// @route   GET /api/admin/rewards
// @desc    Get rewards history (Super Admin)
// @access  Private/SuperAdmin
router.get('/rewards', protect, isSuperAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let rewards = await Reward.find()
      .populate('user', 'name username subscriberCode')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      rewards = rewards.filter(r =>
        r.user && (
          (r.user.name || '').toLowerCase().includes(term) ||
          (r.user.username || '').toLowerCase().includes(term) ||
          (r.user.subscriberCode || '').toLowerCase().includes(term)
        )
      );
    }

    res.json({ success: true, rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/rewards/:id
// @desc    Delete a reward and deduct points from member
// @access  Private/SuperAdmin
router.delete('/rewards/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id).populate('user');
    if (!reward) return res.status(404).json({ success: false, message: 'المكافأة غير موجودة' });

    const member = await User.findById(reward.user._id);
    if (member) {
      // طرح النقاط من العضو
      await User.findByIdAndUpdate(member._id, {
        $inc: {
          bonusPoints: -reward.amount,
          monthlyPoints: -reward.amount,
          points: -reward.amount
        }
      });

      // حذف PointTransaction المرتبطة
      await PointTransaction.deleteOne({
        memberId: member._id,
        type: 'bonus',
        sourceType: 'admin_bonus',
        points: reward.amount,
        description: reward.reason || ''
      });

      console.log(`🗑️ حذف مكافأة ${reward.amount} نقطة من ${member.name}`);
    }

    await Reward.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف المكافأة وخصم النقاط' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/service-points
// @desc    Get service point transactions log
// @access  Private/SuperAdmin
router.get('/service-points', protect, isSuperAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let txns = await PointTransaction.find({ type: 'personal', sourceType: 'service' })
      .populate('memberId', 'name username subscriberCode')
      .sort({ earnedAt: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      txns = txns.filter(t =>
        t.memberId && (
          (t.memberId.name || '').toLowerCase().includes(term) ||
          (t.memberId.username || '').toLowerCase().includes(term) ||
          (t.memberId.subscriberCode || '').toLowerCase().includes(term)
        )
      );
    }

    res.json({ success: true, transactions: txns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/service-points/:id
// @desc    Delete a service point transaction and deduct points from member
// @access  Private/SuperAdmin
router.delete('/service-points/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const txn = await PointTransaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'المعاملة غير موجودة' });
    if (txn.type !== 'personal' || txn.sourceType !== 'service') {
      return res.status(400).json({ success: false, message: 'ليست معاملة خدمات' });
    }

    const member = await User.findById(txn.memberId);
    if (member) {
      await User.findByIdAndUpdate(member._id, {
        $inc: {
          monthlyPoints: -txn.points,
          points: -txn.points
        }
      });
      console.log(`🗑️ حذف ${txn.points} نقطة خدمات من ${member.name}`);
    }

    await PointTransaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف نقاط الخدمة وخصمها من العضو' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Super Admin and Regional Admin)
// @access  Private/Admin
router.get('/users', protect, isAdmin, canViewMembers, async (req, res) => {
  try {
    let query = {};

    // Regional admins can only see members and customers in their regions
    if (req.user.role === 'regional_admin') {
      query.region = { $in: req.user.managedRegions };
      query.role = { $in: ['member', 'customer'] };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('sponsorId', 'name subscriberId subscriberCode')
      .populate('region', 'name nameAr nameEn code')
      .sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', protect, isAdmin, canViewMembers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Regional admins can only view users in their regions
    if (req.user.role === 'regional_admin') {
      if (!req.user.managedRegions.includes(user.region)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this user'
        });
      }
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', protect, isAdmin, canManageMembers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin secretaries can ONLY change the sponsor code
    if (req.user.role === 'admin_secretary') {
      if (!req.body.newSponsorCode) {
        return res.status(403).json({
          success: false,
          message: 'سكرتير الإدارة مسموح له فقط بتغيير كود الراعي'
        });
      }
      // Strip all other fields - only allow newSponsorCode
      Object.keys(req.body).forEach(key => {
        if (key !== 'newSponsorCode') delete req.body[key];
      });
    }

    // Regional admins can only update users in their regions
    if (req.user.role === 'regional_admin') {
      // Convert ObjectIds to strings for comparison
      const userRegionStr = user.region?.toString();
      const managedRegionStrs = req.user.managedRegions.map(r => r.toString());

      if (!userRegionStr || !managedRegionStrs.includes(userRegionStr)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to update this user'
        });
      }

      // Regional admins cannot change roles or critical fields
      // Check if role is being CHANGED (not just sent with same value)
      if ((req.body.role && req.body.role !== user.role) || req.body.subscriberCode || req.body.newSponsorCode) {
        return res.status(403).json({
          success: false,
          message: 'Regional admins cannot change user roles or referral codes'
        });
      }
    }

    // Check if username is being changed and if it's unique
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ username: req.body.username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم موجود مسبقاً'
        });
      }
    }

    // Super Admin can update subscriberCode directly
    if (req.body.subscriberCode && req.user.role === 'super_admin') {
      // Check if the new subscriberCode is unique
      const existingCode = await User.findOne({
        subscriberCode: req.body.subscriberCode.toUpperCase(),
        _id: { $ne: user._id }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'كود الإحالة موجود مسبقاً'
        });
      }

      user.subscriberCode = req.body.subscriberCode.toUpperCase();
    }

    // Handle sponsor code change
    if (req.body.newSponsorCode) {
      // Only super admin or admin_secretary can change sponsor
      if (!['super_admin', 'admin_secretary'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'يمكن للسوبر أدمن وسكرتير الإدارة فقط تغيير الراعي'
        });
      }

      // Find the new sponsor by their subscriberCode
      const newSponsor = await User.findOne({ subscriberCode: req.body.newSponsorCode.toUpperCase() });

      if (!newSponsor) {
        return res.status(400).json({
          success: false,
          message: 'كود الراعي غير صحيح'
        });
      }

      // Verify the new sponsor is a member or admin
      if (newSponsor.role !== 'member' && newSponsor.role !== 'super_admin' && newSponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'الراعي يجب أن يكون عضواً أو أدمن'
        });
      }

      // Prevent setting self as sponsor
      if (newSponsor._id.toString() === user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تعيين العضو كراعي لنفسه'
        });
      }

      // Remove user from old sponsor's downline
      if (user.sponsorId) {
        await User.findByIdAndUpdate(user.sponsorId, {
          $pull: { downline: user._id }
        });
      }

      // Add user to new sponsor's downline
      await User.findByIdAndUpdate(newSponsor._id, {
        $addToSet: { downline: user._id }
      });

      // Update the sponsorId, referredBy, and sponsorCode (for team lookups)
      user.sponsorId = newSponsor._id;
      user.referredBy = newSponsor._id;
      user.sponsorCode = newSponsor.subscriberCode;
      delete req.body.newSponsorCode;
    }

    // Check if converting customer to member
    const isConvertingToMember = user.role === 'customer' && req.body.role === 'member';

    // Handle password change if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
      user.password = req.body.password; // pre-save hook will hash it
    }

    // Update other allowed fields
    const allowedUpdates = ['name', 'username', 'phone', 'countryCode', 'country', 'city', 'role', 'address', 'points', 'monthlyPoints', 'totalCommission', 'availableCommission', 'region', 'supplier', 'bonusPoints', 'compensationPoints', 'profitPoints', 'isActive', 'managedCategories'];

    // حفظ القيمة القديمة للنقاط التراكمية قبل التعديل
    const oldCumulativePoints = user.points || 0;

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'region' && req.body[field] === '') {
          user[field] = null;
        } else if (field === 'isActive') {
          user[field] = req.body[field] === true || req.body[field] === 'true';
        } else if (field === 'bonusPoints' || field === 'compensationPoints' || field === 'monthlyPoints') {
          // لا نعدل القيمة هنا - سيتم معالجتها بعد الحفظ
        } else {
          // Log points updates for debugging
          if (field === 'points') {
            console.log(`🔍 تحديث النقاط التراكمية: من ${user[field]} إلى ${req.body[field]}`);
          }
          user[field] = req.body[field];
        }
      }
    });

    // Handle customer to member conversion
    if (isConvertingToMember) {
      // Check if country and city are provided for subscriber code generation
      if (!user.country || !user.city) {
        return res.status(400).json({
          success: false,
          message: 'الدولة والمدينة مطلوبة لإنشاء كود الإحالة'
        });
      }

      // Generate subscriber code for new member
      if (!user.subscriberCode) {
        user.subscriberCode = await User.generateSubscriberCode(user.country, user.city);
      }

      // Set initial member rank
      user.memberRank = 1; // Start with rank 1 (agent)

      // If a sponsor code was provided, link to sponsor
      if (req.body.newSponsorCode) {
        const sponsor = await User.findOne({ subscriberCode: req.body.newSponsorCode.toUpperCase() });
        if (sponsor && (sponsor.role === 'member' || sponsor.role === 'super_admin' || sponsor.role === 'regional_admin')) {
          user.sponsorId = sponsor._id;
          // Add to sponsor's downline
          await User.findByIdAndUpdate(sponsor._id, {
            $addToSet: { downline: user._id }
          });
        }
      }
    }

    await user.save();

    // توزيع الفرق في النقاط التراكمية على الأعضاء العلويين
    if (req.body.points !== undefined && user.role === 'member') {
      const newCumulativePoints = parseInt(req.body.points) || 0;
      const cumulativeDiff = newCumulativePoints - oldCumulativePoints;
      if (cumulativeDiff !== 0) {
        console.log(`📊 فرق النقاط التراكمية: ${cumulativeDiff} - سيتم التوزيع على الأعضاء العلويين`);
        await distributeCumulativePointsToUpline(user, cumulativeDiff);
      }
    }

    // ══════════════════════════════════════════════════════════════
    // معالجة نقاط المكافأة والتعويض والنقاط الشهرية (إعادة ضبط مباشر للقيمة المُرسلة)
    // ══════════════════════════════════════════════════════════════

    // التحقق من وجود تعديل على النقاط
    const hasBonusUpdate = req.body.bonusPoints !== undefined;
    const hasCompensationUpdate = req.body.compensationPoints !== undefined;
    const hasMonthlyPointsUpdate = req.body.monthlyPoints !== undefined;
    const hasServicePointsUpdate = req.body.servicePoints !== undefined;

    // 1. معالجة نقاط المكافأة (تُوزع على الأعضاء العلويين)
    // ملاحظة: الفرونت إند يُرسل القيمة المُراد إضافتها، وليس القيمة النهائية
    if (hasBonusUpdate && user.role === 'member') {
      const bonusPointsToAdd = parseInt(req.body.bonusPoints) || 0;

      // إذا كانت القيمة موجبة، نضيفها لنقاط الأداء الشخصي
      if (bonusPointsToAdd > 0) {
        console.log(`📊 إضافة ${bonusPointsToAdd} نقطة مكافأة لـ ${user.name}`);

        // تحديث atomic باستخدام $inc لتجنب race condition
        await User.findByIdAndUpdate(user._id, {
          $inc: {
            bonusPoints: bonusPointsToAdd,
            monthlyPoints: bonusPointsToAdd,
            points: bonusPointsToAdd
          }
        });
        console.log(`📊 تم إضافة ${bonusPointsToAdd} نقطة مكافأة (atomic $inc)`);

        // تسجيل معاملة نقاط المكافأة الإدارية
        try {
          await PointTransaction.create({
            memberId: user._id,
            points: bonusPointsToAdd,
            type: 'bonus',
            sourceType: 'admin_bonus',
            description: req.body.bonusPointsReason || '',
            earnedAt: new Date()
          });
        } catch (ptErr) {
          console.error('PointTransaction record failed (non-critical):', ptErr.message);
        }

        // حفظ سجل المكافأة
        await Reward.create({
          user: user._id,
          addedBy: req.user._id,
          amount: bonusPointsToAdd,
          reason: req.body.bonusPointsReason || ''
        });

        // نقاط المكافأة لا تُوزع على الأعضاء العلويين
        // تُضاف فقط للعضو نفسه
        console.log('✅ نقاط المكافأة أُضيفت للعضو فقط (بدون توزيع على الأعضاء العلويين)');
      }
    }

    // 2. معالجة نقاط التعويض (لا توزع، تُضاف للنقاط التراكمية فقط)
    // ملاحظة: الفرونت إند يُرسل القيمة المُراد إضافتها، وليس القيمة النهائية
    if (hasCompensationUpdate) {
      const compensationPointsToAdd = parseInt(req.body.compensationPoints) || 0;

      // إذا كانت القيمة موجبة، نضيفها
      if (compensationPointsToAdd > 0) {
        console.log(`📊 إضافة ${compensationPointsToAdd} نقطة تعويض لـ ${user.name}`);

        // تحديث atomic باستخدام $inc لتجنب race condition
        await User.findByIdAndUpdate(user._id, {
          $inc: {
            compensationPoints: compensationPointsToAdd,
            points: compensationPointsToAdd
          }
        });
        console.log(`📊 تم إضافة ${compensationPointsToAdd} نقطة تعويض (atomic $inc)`);

        // توزيع نقاط التعويض على الأعضاء العلويين (تراكمي فقط، بدون أرباح)
        console.log('✅ توزيع نقاط التعويض على الأعضاء العلويين (تراكمي فقط)');
        await distributeCumulativePointsToUpline(user, compensationPointsToAdd);
      }
    }

    // 3. معالجة نقاط الخدمات (تُوزع على الأعضاء العلويين مثل الطلبات تماماً)
    if (hasServicePointsUpdate && user.role === 'member') {
      const servicePointsToAdd = parseInt(req.body.servicePoints) || 0;
      if (servicePointsToAdd > 0) {
        console.log(`📊 إضافة ${servicePointsToAdd} نقطة خدمات لـ ${user.name}`);
        const freshUser = await User.findById(user._id);
        await distributeCommissions(freshUser, servicePointsToAdd, 'service', req.body.servicePointsReason || '');
        console.log('✅ نقاط الخدمات أُضيفت ووُزعت على الأعضاء العلويين مثل الطلبات');
      }
    }

    // 4. معالجة النقاط الشهرية (توزيع نقاط الأجيال فقط، بدون عمولات)
    if (hasMonthlyPointsUpdate && user.role === 'member') {
      console.log('🔍 تحديث النقاط الشهرية:', {
        hasMonthlyPointsUpdate,
        userRole: user.role,
        userName: user.name
      });

      const newMonthlyPoints = parseInt(req.body.monthlyPoints) || 0;
      const oldMonthlyPoints = user.monthlyPoints || 0;
      const monthlyPointsDifference = newMonthlyPoints - oldMonthlyPoints;

      console.log('🔍 التفاصيل:', {
        newMonthlyPoints,
        oldMonthlyPoints,
        monthlyPointsDifference
      });

      // تحديث قيمة monthlyPoints مباشرة (set)
      user.monthlyPoints = newMonthlyPoints;
      await user.save();

      // تحديث النقاط التراكمية بشكل atomic لتجنب race condition
      if (monthlyPointsDifference !== 0) {
        await User.findByIdAndUpdate(user._id, { $inc: { points: monthlyPointsDifference } });
        console.log(`📊 تحديث نقاط العضو التراكمية بفرق: ${monthlyPointsDifference} (atomic $inc)`);

        // تسجيل PointTransaction للنقاط اليدوية حتى تُحتسب عند إغلاق الفترة
        try {
          await PointTransaction.create({
            memberId: user._id,
            points: monthlyPointsDifference,
            type: 'personal',
            sourceType: 'admin_direct',
            description: `تعديل يدوي من الأدمن (${monthlyPointsDifference > 0 ? '+' : ''}${monthlyPointsDifference})`,
            earnedAt: new Date()
          });
        } catch (ptErr) {
          console.error('PointTransaction admin_direct record failed (non-critical):', ptErr.message);
        }
      }

      // توزيع أو طرح النقاط من الأعضاء العلويين حسب الفرق
      if (monthlyPointsDifference !== 0) {
        if (monthlyPointsDifference > 0) {
          console.log('✅ زيادة - سيتم إضافة النقاط للأعضاء العلويين');
          await distributeGenerationPointsOnly(user, monthlyPointsDifference);
        } else {
          console.log('⚠️ نقصان - سيتم طرح النقاط من الأعضاء العلويين');
          await distributeGenerationPointsOnly(user, monthlyPointsDifference); // الفرق سالب سيتم طرحه
        }
      } else {
        console.log('⚠️ لا يوجد تغيير في النقاط');
      }
    }

    // تحديث رتبة العضو بعد أي تعديل على بياناته (ترقية أو تخفيض)
    if (user.role === 'member') {
      try {
        await updateMemberRank(user._id, User);
      } catch (rankError) {
        console.error('خطأ في تحديث الرتبة:', rankError);
      }
    }

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('sponsorId', 'name subscriberId subscriberCode')
      .populate('region', 'name nameAr nameEn code');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Super Admin Only
router.put('/users/:id/role', protect, isSuperAdmin, async (req, res) => {
  try {
    const { role, sponsorCode } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role
    const validRoles = ['customer', 'member', 'regional_admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // إذا كان التحويل من customer إلى member، يجب وجود كود إحالة
    if (user.role === 'customer' && role === 'member') {
      if (!sponsorCode || sponsorCode.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'كود الإحالة مطلوب عند تحويل عميل إلى عضو',
          messageAr: 'كود الإحالة مطلوب عند تحويل عميل إلى عضو'
        });
      }

      // البحث عن الراعي بواسطة كود الإحالة
      const sponsor = await User.findOne({ subscriberCode: sponsorCode.toUpperCase() });

      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'كود الإحالة غير صحيح',
          messageAr: 'كود الإحالة غير صحيح'
        });
      }

      if (sponsor.role !== 'member' && sponsor.role !== 'super_admin' && sponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'الراعي يجب أن يكون عضواً',
          messageAr: 'الراعي يجب أن يكون عضواً'
        });
      }

      // تعيين الراعي
      user.sponsorId = sponsor._id;

      // إنشاء كود إحالة للعضو الجديد
      user.subscriberCode = await User.generateSubscriberCode(user.country, user.city);

      // إضافة العضو لقائمة downline الخاصة بالراعي
      await User.findByIdAndUpdate(sponsor._id, {
        $addToSet: { downline: user._id }
      });

      // ضبط الرتبة الابتدائية للعضو الجديد
      user.memberRank = 'agent'; // أول رتبة
    }

    // إذا كان التحويل من member إلى customer، إزالة بيانات العضوية
    if (user.role === 'member' && role === 'customer') {
      user.memberRank = undefined;
      user.subscriberCode = undefined;
      user.sponsorId = undefined;
      user.downline = [];
      user.points = 0;
      user.monthlyPoints = 0;
      user.totalCommission = 0;
      user.availableCommission = 0;
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('sponsorId', 'name subscriberCode');

    res.json({
      success: true,
      message: 'Role updated successfully',
      messageAr: 'تم تحديث الدور بنجاح',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin (Super Admin can delete any, Regional Admin can delete users in their region)
router.delete('/users/:id', protect, isAdmin, canManageMembers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin'
      });
    }

    // Prevent deleting regional admin (only super admin can)
    if (user.role === 'regional_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete regional admins'
      });
    }

    // Regional admin can only delete users in their region
    if (req.user.role === 'regional_admin') {
      const adminRegion = req.user.region?.toString() || req.user.regionId?.toString();
      const userRegion = user.region?.toString() || user.regionId?.toString();

      if (!adminRegion || !userRegion || adminRegion !== userRegion) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete users in your region'
        });
      }
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (any role)
// @access  Private/Admin
router.post('/users', protect, isAdmin, canManageMembers, async (req, res) => {
  try {
    console.log('=== Creating user ===');
    console.log('Request body:', req.body);

    const { username, name, password, phone, country, city, role, sponsorCode, region, companyName, taxId } = req.body;

    console.log('Extracted username:', username, 'Type:', typeof username);
    console.log('Extracted name:', name, 'Type:', typeof name);
    console.log('Extracted password:', password, 'Type:', typeof password);

    // Validate required fields
    if (!username || !name || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'يرجى ملء جميع الحقول المطلوبة'
      });
    }

    // Validate city and country for code generation (member only needs this)
    if (role === 'member') {
      if (!country || !country.trim()) {
        console.log('Missing country');
        return res.status(400).json({
          success: false,
          message: 'الدولة مطلوبة',
          messageEn: 'Country is required'
        });
      }

      if (!city || !city.trim()) {
        console.log('Missing city');
        return res.status(400).json({
          success: false,
          message: 'المدينة مطلوبة',
          messageEn: 'City is required'
        });
      }
    }

    // Clean and validate username (must be string)
    console.log('About to clean username...');
    const cleanUsername = String(username).trim();
    console.log('Clean username:', cleanUsername);
    if (!cleanUsername) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم غير صالح'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: cleanUsername.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم موجود بالفعل'
      });
    }

    // Validate role
    const validRoles = ['customer', 'member', 'supplier', 'regional_admin', 'category_admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المستخدم غير صحيح'
      });
    }

    const userData = {
      username: cleanUsername.toLowerCase(),
      name,
      password,
      phone: phone || '',
      country: country || '',
      city: city || '',
      role: role || 'customer'
    };

    // Add companyName and taxNumber for suppliers
    if (role === 'supplier') {
      if (companyName) userData.companyName = companyName;
      if (taxId) userData.taxNumber = taxId;  // Note: frontend sends taxId, but model uses taxNumber
    }

    // Add region for regional_admin
    if (role === 'regional_admin' && region) {
      userData.region = region;
      userData.managedRegions = [region]; // Add to managed regions
    }

    // تصنيف تلقائي للمستخدمين حسب منطقة الادمن
    // إذا كان الادمن الذي يضيف المستخدم هو regional_admin، يتم تصنيف المستخدم من نفس منطقة الادمن
    if (req.user.role === 'regional_admin' && (role === 'member' || role === 'customer')) {
      if (req.user.region) {
        userData.region = req.user.region;
      }
    }

    // إذا تم تحديد منطقة يدوياً من الـ frontend، نستخدمها (أولوية للاختيار اليدوي)
    if (region && (role === 'member' || role === 'customer')) {
      userData.region = region;
    }

    // Handle sponsor for member and customer roles
    if ((role === 'member' || role === 'customer') && sponsorCode) {
      const sponsor = await User.findOne({ subscriberCode: sponsorCode });

      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'كود الراعي غير صحيح'
        });
      }

      if (sponsor.role !== 'member' && sponsor.role !== 'super_admin' && sponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'الراعي يجب أن يكون عضواً'
        });
      }

      userData.sponsorId = sponsor._id;
      userData.sponsorCode = sponsor.subscriberCode; // IMPORTANT: Set sponsorCode for team hierarchy
      userData.referredBy = sponsor._id; // For commission distribution
    }

    // Create user
    const newUser = await User.create(userData);

    // Update region with regional admin
    if (role === 'regional_admin' && region) {
      const Region = require('../models/Region');
      await Region.findByIdAndUpdate(region, {
        regionalAdmin: newUser._id
      });
    }

    // Generate subscriber code for members
    if (role === 'member') {
      newUser.subscriberCode = await User.generateSubscriberCode(country, city);
      await newUser.save();

      // Add to sponsor's downline
      if (newUser.sponsorId) {
        await User.findByIdAndUpdate(newUser.sponsorId, {
          $addToSet: { downline: newUser._id }
        });
      }
    }

    const userResponse = await User.findById(newUser._id)
      .select('-password')
      .populate('sponsorId', 'name subscriberCode');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/admin/regional-admin
// @desc    Create regional admin
// @access  Private/Super Admin Only
router.post('/regional-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { username, name, password, email, phone, managedRegions, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const regionalAdmin = await User.create({
      username,
      name,
      password,
      email,
      phone,
      role: 'regional_admin',
      managedRegions: managedRegions || [],
      permissions: permissions || {
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
        canManageCommissions: false
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: regionalAdmin._id,
        username: regionalAdmin.username,
        name: regionalAdmin.name,
        role: regionalAdmin.role,
        managedRegions: regionalAdmin.managedRegions,
        permissions: regionalAdmin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/category-admins
// @desc    Get all category admins
// @access  Private/Super Admin Only
router.get('/category-admins', protect, isSuperAdmin, async (req, res) => {
  try {
    const categoryAdmins = await User.find({ role: 'category_admin' })
      .select('username name phone managedCategories permissions isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: categoryAdmins.length,
      data: categoryAdmins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/category-admin
// @desc    Create category admin
// @access  Private/Super Admin Only
router.post('/category-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { username, name, password, phone, managedCategories, permissions } = req.body;

    // Validate required fields
    if (!username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, name and password are required',
        messageAr: 'اسم المستخدم والاسم وكلمة المرور مطلوبة'
      });
    }

    // Validate at least one category is assigned
    if (!managedCategories || managedCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one category must be assigned',
        messageAr: 'يجب تعيين قسم واحد على الأقل'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
        messageAr: 'اسم المستخدم موجود بالفعل'
      });
    }

    const categoryAdmin = await User.create({
      username: username.toLowerCase(),
      name,
      password,
      phone: phone || '',
      role: 'category_admin',
      managedCategories: managedCategories || [],
      permissions: permissions || {
        canViewProducts: true,
        canManageProducts: true,
        canViewOrders: true,
        canManageOrders: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: categoryAdmin._id,
        username: categoryAdmin.username,
        name: categoryAdmin.name,
        role: categoryAdmin.role,
        managedCategories: categoryAdmin.managedCategories,
        permissions: categoryAdmin.permissions
      },
      message: 'Category admin created successfully',
      messageAr: 'تم إنشاء مدير القسم بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/category-admin/:id
// @desc    Update category admin
// @access  Private/Super Admin Only
router.put('/category-admin/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const { managedCategories, permissions, isActive } = req.body;

    const categoryAdmin = await User.findById(req.params.id);

    if (!categoryAdmin || categoryAdmin.role !== 'category_admin') {
      return res.status(404).json({
        success: false,
        message: 'Category admin not found',
        messageAr: 'مدير القسم غير موجود'
      });
    }

    // Update fields
    if (managedCategories !== undefined) categoryAdmin.managedCategories = managedCategories;
    if (permissions !== undefined) categoryAdmin.permissions = permissions;
    if (isActive !== undefined) categoryAdmin.isActive = isActive;

    await categoryAdmin.save();

    res.json({
      success: true,
      data: {
        id: categoryAdmin._id,
        username: categoryAdmin.username,
        name: categoryAdmin.name,
        role: categoryAdmin.role,
        managedCategories: categoryAdmin.managedCategories,
        permissions: categoryAdmin.permissions,
        isActive: categoryAdmin.isActive
      },
      message: 'Category admin updated successfully',
      messageAr: 'تم تحديث مدير القسم بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/category-admin/:id/permissions
// @desc    Update category admin permissions
// @access  Private/Super Admin Only
router.put('/category-admin/:id/permissions', protect, isSuperAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;

    const categoryAdmin = await User.findById(req.params.id);

    if (!categoryAdmin || categoryAdmin.role !== 'category_admin') {
      return res.status(404).json({
        success: false,
        message: 'Category admin not found',
        messageAr: 'مدير القسم غير موجود'
      });
    }

    // Update only the 4 specific permissions for category admins
    categoryAdmin.permissions = {
      ...categoryAdmin.permissions,
      canViewProducts: permissions.canViewProducts !== undefined ? permissions.canViewProducts : categoryAdmin.permissions.canViewProducts,
      canManageProducts: permissions.canManageProducts !== undefined ? permissions.canManageProducts : categoryAdmin.permissions.canManageProducts,
      canViewOrders: permissions.canViewOrders !== undefined ? permissions.canViewOrders : categoryAdmin.permissions.canViewOrders,
      canManageOrders: permissions.canManageOrders !== undefined ? permissions.canManageOrders : categoryAdmin.permissions.canManageOrders
    };

    await categoryAdmin.save();

    res.json({
      success: true,
      data: {
        id: categoryAdmin._id,
        username: categoryAdmin.username,
        name: categoryAdmin.name,
        permissions: categoryAdmin.permissions
      },
      message: 'Permissions updated successfully',
      messageAr: 'تم تحديث الصلاحيات بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// Sales Employee Routes
// ============================================================

// @route   GET /api/admin/sales-employees
router.get('/sales-employees', protect, isSuperAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'sales_employee' }).select('-password').sort('-createdAt');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/sales-employee
router.post('/sales-employee', protect, isSuperAdmin, async (req, res) => {
  try {
    const { username, name, password, phone, countryCode } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ success: false, messageAr: 'اسم المستخدم والاسم وكلمة المرور مطلوبة' });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, messageAr: 'اسم المستخدم موجود بالفعل' });
    }
    const emp = await User.create({
      username: username.toLowerCase(), name, password,
      phone: phone || '', countryCode: countryCode || '+970',
      role: 'sales_employee'
    });
    res.status(201).json({
      success: true,
      data: { id: emp._id, username: emp.username, name: emp.name, role: emp.role, phone: emp.phone },
      messageAr: 'تم إنشاء موظف المبيعات بنجاح'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/sales-employee/:id
router.put('/sales-employee/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const { name, phone, countryCode, password, isActive } = req.body;
    const emp = await User.findOne({ _id: req.params.id, role: 'sales_employee' });
    if (!emp) return res.status(404).json({ success: false, messageAr: 'موظف المبيعات غير موجود' });
    if (name) emp.name = name;
    if (phone !== undefined) emp.phone = phone;
    if (countryCode) emp.countryCode = countryCode;
    if (password) emp.password = password;
    if (isActive !== undefined) emp.isActive = isActive;
    await emp.save();
    res.json({ success: true, data: { id: emp._id, username: emp.username, name: emp.name, phone: emp.phone, isActive: emp.isActive }, messageAr: 'تم التحديث بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/sales-employee/:id
router.delete('/sales-employee/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const emp = await User.findOne({ _id: req.params.id, role: 'sales_employee' });
    if (!emp) return res.status(404).json({ success: false, messageAr: 'موظف المبيعات غير موجود' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, messageAr: 'تم حذف موظف المبيعات بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// Admin Secretary Routes
// ============================================================

// @route   GET /api/admin/admin-secretaries
router.get('/admin-secretaries', protect, isSuperAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'admin_secretary' }).select('-password').sort('-createdAt');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/admin-secretary
router.post('/admin-secretary', protect, isSuperAdmin, async (req, res) => {
  try {
    const { username, name, password, phone, countryCode } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ success: false, messageAr: 'اسم المستخدم والاسم وكلمة المرور مطلوبة' });
    }
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, messageAr: 'اسم المستخدم موجود بالفعل' });
    }
    const sec = await User.create({
      username: username.toLowerCase(), name, password,
      phone: phone || '', countryCode: countryCode || '+970',
      role: 'admin_secretary',
      permissions: { canManageMembers: true, canViewMembers: true }
    });
    res.status(201).json({
      success: true,
      data: { id: sec._id, username: sec.username, name: sec.name, role: sec.role, phone: sec.phone },
      messageAr: 'تم إنشاء سكرتير الإدارة بنجاح'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/admin-secretary/:id
router.put('/admin-secretary/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const { name, phone, countryCode, password, isActive } = req.body;
    const sec = await User.findOne({ _id: req.params.id, role: 'admin_secretary' });
    if (!sec) return res.status(404).json({ success: false, messageAr: 'سكرتير الإدارة غير موجود' });
    if (name) sec.name = name;
    if (phone !== undefined) sec.phone = phone;
    if (countryCode) sec.countryCode = countryCode;
    if (password) sec.password = password;
    if (isActive !== undefined) sec.isActive = isActive;
    await sec.save();
    res.json({ success: true, data: { id: sec._id, username: sec.username, name: sec.name, phone: sec.phone, isActive: sec.isActive }, messageAr: 'تم التحديث بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/admin-secretary/:id
router.delete('/admin-secretary/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const sec = await User.findOne({ _id: req.params.id, role: 'admin_secretary' });
    if (!sec) return res.status(404).json({ success: false, messageAr: 'سكرتير الإدارة غير موجود' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, messageAr: 'تم حذف سكرتير الإدارة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    let userQuery = {};
    let orderQuery = {};

    // Regional admins see stats for their regions only
    if (req.user.role === 'regional_admin') {
      userQuery.region = { $in: req.user.managedRegions };
      // Get user IDs in managed regions for order filtering
      const regionUserIds = await User.find({ region: { $in: req.user.managedRegions } }).distinct('_id');
      orderQuery.user = { $in: regionUserIds };
    }

    // Super admin can filter by specific region
    if (req.user.role === 'super_admin' && req.query.regionId) {
      userQuery.region = req.query.regionId;
      // Get user IDs in selected region for order filtering
      const regionUserIds = await User.find({ region: req.query.regionId }).distinct('_id');
      orderQuery.user = { $in: regionUserIds };
    }

    // User statistics
    const totalUsers = await User.countDocuments(userQuery);
    const totalMembers = await User.countDocuments({ ...userQuery, role: 'member' });
    const totalCustomers = await User.countDocuments({ ...userQuery, role: 'customer' });
    const totalSuppliers = await User.countDocuments({ ...userQuery, role: 'supplier' });
    const totalAdmins = await User.countDocuments({
      ...userQuery,
      role: { $in: ['regional_admin', 'super_admin'] }
    });

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const lowStockProducts = await Product.countDocuments({
      stock: { $gt: 0, $lte: 10 }
    });

    // Order statistics
    const totalOrders = await Order.countDocuments(orderQuery);
    const pendingOrders = await Order.countDocuments({ ...orderQuery, status: 'pending' });
    const preparedOrders = await Order.countDocuments({ ...orderQuery, status: 'prepared' });
    const onTheWayOrders = await Order.countDocuments({ ...orderQuery, status: 'on_the_way' });
    const receivedOrders = await Order.countDocuments({ ...orderQuery, status: 'received' });
    const cancelledOrders = await Order.countDocuments({ ...orderQuery, status: 'cancelled' });

    // Revenue statistics
    const orders = await Order.find(orderQuery);
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = await Order.find({
      ...orderQuery,
      status: 'received'
    });
    const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Commission statistics
    const totalCommissionPaid = await User.aggregate([
      { $match: userQuery },
      { $group: { _id: null, total: { $sum: '$withdrawnCommission' } } }
    ]);
    const totalCommissionPending = await User.aggregate([
      { $match: userQuery },
      { $group: { _id: null, total: { $sum: '$availableCommission' } } }
    ]);

    // Points statistics
    const totalPoints = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    const totalMonthlyPoints = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      { $group: { _id: null, total: { $sum: '$monthlyPoints' } } }
    ]);
    const totalUncalculatedPoints = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ['$monthlyPoints', 0] },
                { $ifNull: ['$generation1Points', 0] },
                { $ifNull: ['$generation2Points', 0] },
                { $ifNull: ['$generation3Points', 0] },
                { $ifNull: ['$generation4Points', 0] },
                { $ifNull: ['$generation5Points', 0] }
              ]
            }
          }
        }
      }
    ]);

    // Profit statistics - calculate company profit from completed orders
    let totalProfit = 0;
    for (const order of completedOrders) {
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          const itemRevenue = item.price * item.quantity;
          const itemCost = (item.wholesalePriceAtPurchase || 0) * item.quantity;
          const itemProfit = itemRevenue - itemCost;
          totalProfit += itemProfit;
        }
      }
    }

    // Member classification statistics
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Stopped members: those who are suspended by admin
    const stoppedMembers = await User.countDocuments({
      ...userQuery,
      role: 'member',
      isSuspended: true
    });

    // Get all members who made an order in the last month
    const activeOrderUsers = await Order.distinct('user', {
      ...orderQuery,
      createdAt: { $gte: oneMonthAgo },
      status: { $in: ['pending', 'processing', 'shipped', 'delivered', 'completed'] }
    });

    // Active members: purchased in last month and not suspended
    const activeMembers = await User.countDocuments({
      ...userQuery,
      role: 'member',
      isSuspended: { $ne: true },
      _id: { $in: activeOrderUsers }
    });

    // Inactive members: didn't purchase in last month and not suspended
    const inactiveMembers = await User.countDocuments({
      ...userQuery,
      role: 'member',
      isSuspended: { $ne: true },
      _id: { $nin: activeOrderUsers }
    });

    // Recent activity
    const recentUsers = await User.find(userQuery)
      .select('name username role createdAt')
      .sort('-createdAt')
      .limit(5);

    const recentOrders = await Order.find(orderQuery)
      .populate('user', 'name username subscriberCode')
      .select('orderNumber totalAmount status createdAt')
      .sort('-createdAt')
      .limit(5);

    // Top members by points
    const topMembers = await User.find({ ...userQuery, role: 'member' })
      .select('name username points monthlyPoints totalCommission')
      .sort('-points')
      .limit(10);

    // Members by rank
    const membersByRank = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      { $group: { _id: '$memberRank', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Members by region
    const membersByRegion = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      {
        $lookup: {
          from: 'regions',
          localField: 'region',
          foreignField: '_id',
          as: 'regionData'
        }
      },
      { $unwind: { path: '$regionData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$region',
          regionName: { $first: '$regionData.nameAr' },
          regionNameEn: { $first: '$regionData.nameEn' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Growth trends - last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const memberGrowth = await User.aggregate([
      {
        $match: {
          ...userQuery,
          role: 'member',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const orderGrowth = await Order.aggregate([
      {
        $match: {
          ...orderQuery,
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          members: totalMembers,
          customers: totalCustomers,
          suppliers: totalSuppliers,
          admins: totalAdmins
        },
        products: {
          total: totalProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
          inStock: totalProducts - outOfStockProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          prepared: preparedOrders,
          onTheWay: onTheWayOrders,
          received: receivedOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          total: totalRevenue,
          completed: completedRevenue,
          pending: totalRevenue - completedRevenue
        },
        commissions: {
          paid: totalCommissionPaid[0]?.total || 0,
          pending: totalCommissionPending[0]?.total || 0,
          total: (totalCommissionPaid[0]?.total || 0) + (totalCommissionPending[0]?.total || 0)
        },
        points: {
          total: totalPoints[0]?.total || 0,
          monthly: totalMonthlyPoints[0]?.total || 0,
          uncalculated: totalUncalculatedPoints[0]?.total || 0
        },
        profit: {
          total: totalProfit,
          completedRevenue: completedRevenue,
          profitMargin: completedRevenue > 0 ? ((totalProfit / completedRevenue) * 100).toFixed(2) : 0
        },
        memberClassification: {
          active: activeMembers,
          inactive: inactiveMembers,
          stopped: stoppedMembers
        },
        recent: {
          users: recentUsers,
          orders: recentOrders
        },
        topMembers,
        membersByRank,
        membersByRegion,
        growth: {
          members: memberGrowth,
          orders: orderGrowth
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', protect, isAdmin, canViewOrders, async (req, res) => {
  try {
    console.log('📋 GET /orders endpoint called');
    console.log('👤 User role:', req.user.role);
    console.log('📁 Managed categories:', req.user.managedCategories);

    let query = {};

    // Regional admins can only see orders from their regions
    if (req.user.role === 'regional_admin') {
      // Build array of regions to check (include both region and managedRegions)
      let regions = [];
      if (req.user.region) {
        regions.push(req.user.region);
      }
      if (req.user.managedRegions && req.user.managedRegions.length > 0) {
        regions = regions.concat(req.user.managedRegions);
      }

      const users = await User.find({ region: { $in: regions } });
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    // Category admins can only see orders containing their managed categories
    if (req.user.role === 'category_admin') {
      console.log('🔒 Applying category_admin filter');
      if (!req.user.managedCategories || req.user.managedCategories.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No categories assigned to your account',
          messageAr: 'لا توجد أقسام مخصصة لحسابك'
        });
      }

      // Find all products in managed categories
      const products = await Product.find({
        category: { $in: req.user.managedCategories }
      }).select('_id name category');

      console.log(`📦 Found ${products.length} products in managed categories:`,
        products.map(p => ({ id: p._id, name: p.name, category: p.category })));

      const productIds = products.map(p => p._id);

      // Filter orders containing these products
      query['orderItems.product'] = { $in: productIds };
      console.log('🔍 Order query:', JSON.stringify(query, null, 2));
    }

    let orders = await Order.find(query)
      .populate('user', 'username name subscriberCode role')
      .populate('orderItems.product', 'name price category images')
      .sort('-createdAt');

    // For category_admin: Filter out orders that contain products from other categories
    if (req.user.role === 'category_admin') {
      orders = orders.filter(order => {
        // Get only existing products (not deleted)
        const existingProducts = order.orderItems.filter(item => item.product);

        // If no existing products, don't show this order
        if (existingProducts.length === 0) {
          return false;
        }

        // Check if ALL existing products are from managed categories
        const allProductsFromManagedCategories = existingProducts.every(item => {
          return req.user.managedCategories.includes(item.product.category);
        });

        return allProductsFromManagedCategories;
      });
      console.log(`🔍 After filtering: ${orders.length} orders remain (only orders with products from managed categories)`);
    }

    console.log(`✅ Returning ${orders.length} orders`);

    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('❌ Error in GET /orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete order (pending only)
// @access  Private/Admin
router.delete('/orders/:id', protect, isAdmin, canManageOrders, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف الطلب إلا إذا كان قيد الانتظار' });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف الطلب' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order details (for pending orders only)
// @access  Private/Admin
router.put('/orders/:id', protect, isAdmin, canManageOrders, adminUpdateOrder);

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', protect, isAdmin, canManageOrders, async (req, res) => {
  try {
    const { status } = req.body;

    // Block category_admin from setting status to "received"
    if (req.user.role === 'category_admin' && status === 'received') {
      return res.status(403).json({
        success: false,
        message: 'Category admins cannot confirm order receipt',
        messageAr: 'مدراء الأقسام لا يمكنهم تأكيد استلام الطلب'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'category images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate category_admin has access to this order
    if (req.user.role === 'category_admin') {
      const orderCategories = [...new Set(
        order.orderItems.map(item => item.product?.category).filter(Boolean)
      )];

      const hasAccess = orderCategories.some(cat =>
        req.user.managedCategories.includes(cat)
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this order',
          messageAr: 'غير مصرح لك بالوصول إلى هذا الطلب'
        });
      }
    }

    const oldStatus = order.status;

    // الحالات التي تعني أن الطلب تم تجهيزه
    const processedStatuses = ['prepared', 'on_the_way', 'received'];
    const wasProcessed = processedStatuses.includes(oldStatus);
    const willBeProcessed = processedStatuses.includes(status);

    // تحديث المخزون فقط عند الانتقال من حالة غير مجهزة إلى حالة مجهزة
    if (!wasProcessed && willBeProcessed) {
      for (const item of order.orderItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              soldCount: item.quantity,
              stock: -item.quantity
            }
          });
        }
      }
      console.log(`📦 Updated stock and soldCount for order ${order.orderNumber}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // إذا تم تغيير الحالة إلى "received" (مستلم) - توزيع النقاط والأرباح
    // ═══════════════════════════════════════════════════════════════
    console.log(`🔍 فحص شرط التوزيع: status === 'received' (${status === 'received'}) && oldStatus !== 'received' (${oldStatus !== 'received'})`);

    if (status === 'received' && oldStatus !== 'received') {
      console.log(`📥 تغيير حالة الطلب ${order.orderNumber} إلى "تم الاستلام" - بدء توزيع النقاط والأرباح`);

      const buyer = await User.findById(order.user);

      if (buyer) {
        // ══════════════════════════════════════════════
        // حالة 1: المشتري عضو (member)
        // ══════════════════════════════════════════════
        // إذا totalPoints = 0 (طلب قديم قبل إضافة النقاط للمنتجات)، احسبها من عناصر الطلب
        const effectivePoints = order.totalPoints || (order.orderItems || []).reduce((s, i) => s + ((i.points || 0) * (i.quantity || 1)), 0);
        const receivedAt = new Date();

        if (buyer.role === 'member' && effectivePoints) {
          console.log(`👤 المشتري عضو: ${buyer.name}`);

          // إعطاء 10 نقاط هدية لأول عملية شراء خلال 30 يوم من التسجيل
          if (!buyer.firstOrderBonus.received && buyer.firstOrderBonus.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(buyer.firstOrderBonus.expiresAt);

            if (now <= expiresAt) {
              const bonusPoints = buyer.firstOrderBonus.points || 10;
              buyer.points = (buyer.points || 0) + bonusPoints;
              buyer.monthlyPoints = (buyer.monthlyPoints || 0) + bonusPoints;
              buyer.firstOrderBonus.received = true;
              await buyer.save();

              // تسجيل معاملة نقاط مكافأة أول طلب
              try {
                await PointTransaction.create({
                  memberId: buyer._id,
                  points: bonusPoints,
                  type: 'bonus',
                  sourceType: 'first_order_bonus',
                  sourceId: order._id,
                  earnedAt: new Date()
                });
              } catch (ptErr) {
                console.error('PointTransaction record failed (non-critical):', ptErr.message);
              }

              console.log(`🎁 ${buyer.name} حصل على ${bonusPoints} نقاط هدية لأول عملية شراء خلال 30 يوم!`);
            }
          }

          // توزيع العمولات على العضو المشتري وأجياله
          const { distributeCommissions } = require('../controllers/orderController');
          await distributeCommissions(buyer, effectivePoints, receivedAt);
          console.log(`✅ تم توزيع ${effectivePoints} نقطة للعضو ${buyer.name} وأجياله`);
        }

        // ══════════════════════════════════════════════
        // حالة 2: المشتري عميل (customer) لديه عضو مُحيل
        // ══════════════════════════════════════════════
        if (buyer.role === 'customer' && order.referredBy) {
          console.log(`👤 المشتري عميل: ${buyer.name}`);

          const referrerUser = await User.findById(order.referredBy);

          if (referrerUser && referrerUser.role === 'member') {
            console.log(`👤 العضو المُحيل: ${referrerUser.name}`);

            // إضافة فرق السعر للعضو المُحيل (إن وجد)
            if (order.priceDifference && order.priceDifference > 0) {
              referrerUser.totalCommission = Math.floor((referrerUser.totalCommission || 0) + order.priceDifference);
              referrerUser.availableCommission = Math.floor((referrerUser.availableCommission || 0) + order.priceDifference);

              console.log(`💰 فرق السعر: العضو ${referrerUser.name} حصل على ${order.priceDifference} شيكل من شراء العميل ${buyer.name}`);
            }

            // إضافة النقاط وتوزيع العمولات على شجرة العضو المُحيل
            if (effectivePoints > 0) {
              const { distributeCommissions } = require('../controllers/orderController');
              await distributeCommissions(referrerUser, effectivePoints, receivedAt);

              console.log(`📊 النقاط: العضو ${referrerUser.name} حصل على توزيع ${effectivePoints} نقطة من شراء العميل ${buyer.name}`);
            }

            // حفظ التغييرات على العضو المُحيل
            await referrerUser.save();
          }
        }

        console.log(`✅ انتهى توزيع النقاط والأرباح للطلب ${order.orderNumber}`);
      }
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// @route   POST /api/admin/profits/check-period
// @desc    Check if period is available for calculation
// @access  Private/Super Admin
router.post('/profits/check-period', protect, isSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ البداية والنهاية'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية'
      });
    }

    const isAvailable = await ProfitPeriod.checkPeriodAvailable(start, end);

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'هذه الفترة تم احتسابها مسبقاً ولا يمكن احتسابها مرة أخرى'
      });
    }

    res.json({
      success: true,
      message: 'الفترة متاحة للاحتساب'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/profits/calculate
// @desc    Calculate profits for a specific period
// @access  Private/Super Admin
router.post('/profits/calculate', protect, isSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ البداية والنهاية'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Check if period is available
    const isAvailable = await ProfitPeriod.checkPeriodAvailable(start, end);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'هذه الفترة تم احتسابها مسبقاً'
      });
    }

    // Get all members
    const members = await User.find({ role: 'member' })
      .select('name username subscriberCode downline points totalCommission availableCommission');

    const membersProfits = [];
    let totalProfits = 0;

    // Calculate profits for each member
    for (const member of members) {
      // Get orders in the period
      const orders = await Order.find({
        user: member._id,
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['delivered', 'completed'] }
      });

      const orderCount = orders.length;
      const salesVolume = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Calculate points earned in this period
      let pointsEarned = 0;
      for (const order of orders) {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product && product.subscriberPrice) {
            const discount = (product.price - product.subscriberPrice) * item.quantity;
            pointsEarned += Math.floor(discount * 1.64);
          }
        }
      }

      // Get downline count
      const downlineCount = member.downline ? member.downline.length : 0;

      // Calculate downline sales
      let downlineSales = 0;
      if (downlineCount > 0) {
        const downlineOrders = await Order.find({
          user: { $in: member.downline },
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed'] }
        });
        downlineSales = downlineOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      }

      // Calculate commission earned in this period
      // This is a simplified calculation - you can adjust based on your business logic
      const commissionEarned = (salesVolume * 0.05) + (downlineSales * 0.02);

      // Calculate total profit (can be adjusted based on your formula)
      const profitAmount = commissionEarned + (pointsEarned * 0.1);

      if (orderCount > 0 || profitAmount > 0) {
        membersProfits.push({
          memberId: member._id,
          memberName: member.name,
          username: member.username,
          memberRank: member.rank || 0,
          rankName: member.rankName || 'عضو',
          rankNameEn: member.rankNameEn || 'Member',
          points: {
            personal: pointsEarned,
            generation1: 0,
            generation2: 0,
            generation3: 0,
            generation4: 0,
            generation5: 0,
            total: pointsEarned
          },
          commissions: {
            performance: {
              totalPoints: pointsEarned,
              totalInShekel: pointsEarned * 0.55
            },
            leadership: {
              totalCommissionPoints: 0,
              commissionInShekel: 0,
              hasLeadershipCommission: false
            }
          },
          profit: {
            performanceProfit: commissionEarned,
            leadershipProfit: 0,
            totalProfit: profitAmount,
            conversionRate: 0.55
          },
          // Keep these for backward compatibility with frontend
          subscriberCode: member.subscriberCode,
          totalOrders: orderCount,
          totalSales: salesVolume,
          totalPoints: pointsEarned,
          totalCommission: commissionEarned,
          profitAmount: profitAmount
        });

        totalProfits += profitAmount;
      }
    }

    // Get the next period number
    const lastPeriod = await ProfitPeriod.findOne().sort({ periodNumber: -1 });
    const nextPeriodNumber = lastPeriod ? lastPeriod.periodNumber + 1 : 1;

    // Create period name
    const periodName = `فترة ${nextPeriodNumber} - ${start.toLocaleDateString('ar-EG')} إلى ${end.toLocaleDateString('ar-EG')}`;

    // Create profit period record
    const profitPeriod = await ProfitPeriod.create({
      periodName,
      periodNumber: nextPeriodNumber,
      startDate: start,
      endDate: end,
      status: 'finalized',
      calculatedBy: req.user._id,
      calculatedByName: req.user.name,
      totalProfits,
      totalMembers: membersProfits.length,
      membersProfits,
      summary: {
        totalMembers: membersProfits.length,
        totalProfits: totalProfits
      }
    });

    // ══════════════════════════════════════════════════════════════
    // تصفير النقاط الشهرية بعد احتساب الأرباح
    // النقاط التراكمية (points) لا تُمس
    // ══════════════════════════════════════════════════════════════
    const allMembers = await User.find({ role: 'member' });
    let resetCount = 0;
    for (const member of allMembers) {
      if (member.monthlyPoints > 0 || member.generation1Points > 0 || member.generation2Points > 0 ||
          member.generation3Points > 0 || member.generation4Points > 0 || member.generation5Points > 0 ||
          member.leadershipPoints > 0) {
        member.monthlyPoints = 0;
        member.generation1Points = 0;
        member.generation2Points = 0;
        member.generation3Points = 0;
        member.generation4Points = 0;
        member.generation5Points = 0;
        member.leadershipPoints = 0;
        member.totalCommission = 0;
        member.availableCommission = 0;
        member.lastPointsReset = new Date();
        await member.save();
        resetCount++;
      }
    }
    console.log(`🔄 تم تصفير النقاط الشهرية لـ ${resetCount} عضو`);

    res.json({
      success: true,
      message: `تم احتساب الأرباح بنجاح وتصفير النقاط الشهرية لـ ${resetCount} عضو`,
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/profits/:id/close
// @desc    Close a profit period
// @access  Private/Super Admin
router.put('/profits/:id/close', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriod = await ProfitPeriod.findById(req.params.id);

    if (!profitPeriod) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفترة'
      });
    }

    if (profitPeriod.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'الفترة مغلقة بالفعل'
      });
    }

    profitPeriod.status = 'paid';
    await profitPeriod.save();

    res.json({
      success: true,
      message: 'تم إغلاق الفترة بنجاح',
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/profits
// @desc    Get all profit periods
// @access  Private/Super Admin
router.get('/profits', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriods = await ProfitPeriod.find()
      .populate('calculatedBy', 'name username')
      .sort('-createdAt');

    res.json({
      success: true,
      data: profitPeriods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/profits/:id
// @desc    Get single profit period
// @access  Private/Super Admin
router.get('/profits/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriod = await ProfitPeriod.findById(req.params.id)
      .populate('calculatedBy', 'name username')
      .populate('membersProfits.memberId', 'name username subscriberCode');

    if (!profitPeriod) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفترة'
      });
    }

    res.json({
      success: true,
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/ranks
// @desc    Get all member ranks configuration
// @access  Private/Admin
router.get('/ranks', protect, isAdmin, async (req, res) => {
  try {
    const ranks = getAllRanks();
    res.json({
      success: true,
      data: ranks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id/downline
// @desc    Get user's downline structure (5 levels)
// @access  Private/Admin
router.get('/users/:id/downline', protect, isAdmin, canViewMembers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء المشتركين'
      });
    }

    const downlineStructure = await getDownlineStructure(User, user._id);
    const downlineCommission = await calculateDownlineCommission(User, user._id);

    // Calculate total downline count
    const totalDownline = Object.values(downlineStructure).reduce(
      (sum, level) => sum + level.length,
      0
    );

    // حساب النقاط التراكمية
    const cumulativePoints = calculateCumulativePoints(user);

    // عد الخطوط البرونزية
    const bronzeLines = await countBronzeLines(user._id, User);

    res.json({
      success: true,
      data: {
        member: {
          id: user._id,
          name: user.name,
          username: user.username,
          subscriberCode: user.subscriberCode,
          memberRank: user.memberRank,
          rankConfig: getRankInfo(user.memberRank),
          points: user.points,
          monthlyPoints: user.monthlyPoints,
          cumulativePoints,
          bronzeLines
        },
        downlineStructure,
        statistics: {
          totalDownline,
          level1Count: downlineStructure.level1.length,
          level2Count: downlineStructure.level2.length,
          level3Count: downlineStructure.level3.length,
          level4Count: downlineStructure.level4.length,
          level5Count: downlineStructure.level5.length,
          estimatedDownlineCommission: downlineCommission
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/rank
// @desc    Update user's member rank
// @access  Private/Super Admin
router.put('/users/:id/rank', protect, isSuperAdmin, async (req, res) => {
  try {
    const { memberRank } = req.body;

    if (!memberRank || memberRank < 1 || memberRank > 9) {
      return res.status(400).json({
        success: false,
        message: 'الدرجة يجب أن تكون بين 1 و 9'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء المشتركين'
      });
    }

    user.memberRank = memberRank;

    // Update downline commission rates based on new rank
    const rankConfig = getRankConfig(memberRank);
    user.downlineCommissionRates = rankConfig.downlineCommissionRates;

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث درجة العضو بنجاح',
      data: {
        user: {
          id: user._id,
          name: user.name,
          memberRank: user.memberRank,
          rankConfig
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/users/update-ranks
// @desc    Auto-update all member ranks based on cumulative points and bronze lines
// @access  Private/Super Admin
router.post('/users/update-ranks', protect, isSuperAdmin, async (req, res) => {
  try {
    const result = await updateAllMembersRanks(User);

    if (result.success) {
      res.json({
        success: true,
        message: `تم تحديث ${result.updatedMembers} عضو بنجاح من أصل ${result.totalMembers}`,
        data: {
          totalMembers: result.totalMembers,
          updatedMembers: result.updatedMembers,
          updates: result.updates
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id/rank-info
// @desc    Get detailed rank information for a member
// @access  Private/Admin
router.get('/users/:id/rank-info', protect, isAdmin, canViewMembers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء'
      });
    }

    // حساب النقاط التراكمية
    const cumulativePoints = calculateCumulativePoints(user);

    // عد الخطوط البرونزية
    const bronzeLines = await countBronzeLines(user._id, User);

    // معلومات الرتبة الحالية
    const currentRankInfo = getRankInfo(user.memberRank);

    // متطلبات الرتبة التالية
    const nextRankInfo = getNextRankRequirements(
      user.memberRank,
      cumulativePoints,
      bronzeLines
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username
        },
        currentRank: {
          rank: user.memberRank,
          ...currentRankInfo
        },
        points: {
          personal: user.monthlyPoints || 0,
          generation1: user.generation1Points || 0,
          generation2: user.generation2Points || 0,
          generation3: user.generation3Points || 0,
          generation4: user.generation4Points || 0,
          generation5: user.generation5Points || 0,
          cumulative: cumulativePoints
        },
        bronzeLines: {
          count: bronzeLines,
          description: 'عدد الأعضاء البرونزيين في المستوى الأول'
        },
        nextRank: nextRankInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// إدارة الفروع (Regions Management)
// ==========================================

const Region = require('../models/Region');

// @route   GET /api/admin/regions
// @desc    Get all regions with statistics
// @access  Private/SuperAdmin
router.get('/regions', protect, isSuperAdmin, async (req, res) => {
  try {
    const regions = await Region.find()
      .populate('regionalAdmin', 'name email phone')
      .sort({ createdAt: -1 });

    // إضافة إحصائيات لكل فرع
    const regionsWithStats = await Promise.all(
      regions.map(async (region) => {
        const members = await User.countDocuments({ region: region._id });
        const products = await Product.countDocuments({
          $or: [
            { region: region._id },
            { 'regionalPricing.region': region._id }
          ]
        });
        const orders = await Order.countDocuments({ 'user': { $in: await User.find({ region: region._id }).distinct('_id') } });

        return {
          ...region.toObject(),
          stats: {
            ...region.stats,
            totalMembers: members,
            totalProducts: products,
            totalOrders: orders
          }
        };
      })
    );

    res.json({
      success: true,
      count: regionsWithStats.length,
      regions: regionsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/regions
// @desc    Create new region
// @access  Private/SuperAdmin
router.post('/regions', protect, isSuperAdmin, async (req, res) => {
  try {
    console.log('📥 Full req.body:', req.body);
    const { name, nameAr, nameEn, code, description, regionalAdmin, settings, contactInfo } = req.body;

    console.log('📥 Extracted region data:', { name, nameAr, nameEn, code, description, regionalAdmin });

    // التحقق من عدم وجود فرع بنفس الكود
    const existingRegion = await Region.findOne({ code: code.toUpperCase() });
    if (existingRegion) {
      return res.status(400).json({
        success: false,
        message: 'Region code already exists'
      });
    }

    console.log('🔨 Creating region with:', { name, nameAr, nameEn, code: code.toUpperCase() });

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

    console.log('✅ Region created successfully:', region._id);

    // تحديث المسؤول الإقليمي
    if (regionalAdmin) {
      await User.findByIdAndUpdate(regionalAdmin, {
        role: 'regional_admin',
        region: region._id,
        $addToSet: { managedRegions: region._id }
      });
    }

    res.status(201).json({
      success: true,
      region
    });
  } catch (error) {
    console.error('❌ Error creating region:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/regions/:id
// @desc    Update region
// @access  Private/SuperAdmin
router.put('/regions/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
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
      // إزالة من المسؤول القديم
      if (region.regionalAdmin) {
        await User.findByIdAndUpdate(region.regionalAdmin, {
          $pull: { managedRegions: region._id }
        });
      }

      // إضافة للمسؤول الجديد
      await User.findByIdAndUpdate(regionalAdmin, {
        role: 'regional_admin',
        region: region._id,
        $addToSet: { managedRegions: region._id }
      });

      region.regionalAdmin = regionalAdmin;
    }

    const updatedRegion = await region.save();

    res.json({
      success: true,
      region: updatedRegion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/regions/:id
// @desc    Delete region
// @access  Private/SuperAdmin
router.delete('/regions/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // التحقق من عدم وجود مستخدمين أو منتجات
    const usersCount = await User.countDocuments({ region: region._id });
    const productsCount = await Product.countDocuments({ region: region._id });

    if (usersCount > 0 || productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete region. It has ${usersCount} users and ${productsCount} products.`,
        usersCount,
        productsCount
      });
    }

    await region.deleteOne();

    res.json({
      success: true,
      message: 'Region deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/regions/:id/products
// @desc    Get products for a specific region
// @access  Private/Admin
router.get('/regions/:id/products', protect, isAdmin, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    const products = await Product.find({
      $or: [
        { region: region._id },
        { isGlobal: true },
        { 'regionalPricing.region': region._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
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
});

// @route   GET /api/admin/regions/:id/members
// @desc    Get members for a specific region
// @access  Private/Admin
router.get('/regions/:id/members', protect, isAdmin, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    const members = await User.find({ region: region._id })
      .select('-password')
      .populate('sponsorId', 'name subscriberCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// إدارة المنتجات حسب الفروع
// ==========================================

// @route   POST /api/admin/products/regional-pricing
// @desc    Add regional pricing to a product
// @access  Private/SuperAdmin
router.post('/products/:productId/regional-pricing', protect, isSuperAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { region, customerPrice, memberPrice, wholesalePrice, bulkPrice, stock, isActive } = req.body;

    // التحقق من وجود الفرع
    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // التحقق من عدم وجود سعر لهذا الفرع مسبقاً
    const existingPricing = product.regionalPricing?.find(
      rp => rp.region.toString() === region
    );

    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'Regional pricing for this region already exists. Use PUT to update.'
      });
    }

    // إضافة السعر الإقليمي
    if (!product.regionalPricing) {
      product.regionalPricing = [];
    }

    product.regionalPricing.push({
      region,
      customerPrice,
      memberPrice,
      wholesalePrice,
      bulkPrice,
      stock: stock || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await product.save();

    res.json({
      success: true,
      message: 'Regional pricing added successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/products/:productId/regional-pricing/:regionId
// @desc    Update regional pricing for a product
// @access  Private/SuperAdmin
router.put('/products/:productId/regional-pricing/:regionId', protect, isSuperAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { customerPrice, memberPrice, wholesalePrice, bulkPrice, stock, isActive } = req.body;

    // العثور على السعر الإقليمي وتحديثه
    const pricingIndex = product.regionalPricing?.findIndex(
      rp => rp.region.toString() === req.params.regionId
    );

    if (pricingIndex === -1 || pricingIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Regional pricing not found for this region'
      });
    }

    if (customerPrice !== undefined) product.regionalPricing[pricingIndex].customerPrice = customerPrice;
    if (memberPrice !== undefined) product.regionalPricing[pricingIndex].memberPrice = memberPrice;
    if (wholesalePrice !== undefined) product.regionalPricing[pricingIndex].wholesalePrice = wholesalePrice;
    if (bulkPrice !== undefined) product.regionalPricing[pricingIndex].bulkPrice = bulkPrice;
    if (stock !== undefined) product.regionalPricing[pricingIndex].stock = stock;
    if (isActive !== undefined) product.regionalPricing[pricingIndex].isActive = isActive;

    await product.save();

    res.json({
      success: true,
      message: 'Regional pricing updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/products/:productId/regional-pricing/:regionId
// @desc    Remove regional pricing from a product
// @access  Private/SuperAdmin
router.delete('/products/:productId/regional-pricing/:regionId', protect, isSuperAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // إزالة السعر الإقليمي
    product.regionalPricing = product.regionalPricing?.filter(
      rp => rp.region.toString() !== req.params.regionId
    );

    await product.save();

    res.json({
      success: true,
      message: 'Regional pricing removed successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/regions/statistics
// @desc    Get comprehensive statistics for all regions
// @access  Private/SuperAdmin
router.get('/regions/statistics', protect, isSuperAdmin, async (req, res) => {
  try {
    const regions = await Region.find();

    const statistics = await Promise.all(
      regions.map(async (region) => {
        // إحصائيات الأعضاء
        const totalMembers = await User.countDocuments({ region: region._id });
        const activeMembers = await User.countDocuments({
          region: region._id,
          isActive: true
        });

        // إحصائيات المنتجات
        const totalProducts = await Product.countDocuments({
          $or: [
            { region: region._id },
            { 'regionalPricing.region': region._id }
          ]
        });

        // إحصائيات الطلبات
        const regionUsers = await User.find({ region: region._id }).distinct('_id');
        const orders = await Order.find({ user: { $in: regionUsers } });
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // أفضل الأعضاء
        const topMembers = await User.find({ region: region._id })
          .sort({ points: -1 })
          .limit(5)
          .select('name points memberRank');

        return {
          region: {
            _id: region._id,
            name: region.name,
            nameAr: region.nameAr,
            code: region.code
          },
          members: {
            total: totalMembers,
            active: activeMembers,
            inactive: totalMembers - activeMembers
          },
          products: {
            total: totalProducts
          },
          orders: {
            total: totalOrders,
            revenue: totalRevenue,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
          },
          topMembers
        };
      })
    );

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/search-users
// @desc    Search for members and customers (for creating orders)
// @access  Private/Super Admin Only
router.get('/search-users', protect, isSuperAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    console.log('🔍 Search users request received:', { search, user: req.user?.username });

    if (!search || search.trim() === '') {
      console.log('⚠️ Empty search term');
      return res.json({
        success: true,
        users: []
      });
    }

    const searchTerm = search.trim();
    console.log('🔎 Searching for:', searchTerm);

    // Search by name, username, subscriberCode, or phone
    const users = await User.find({
      role: { $in: ['member', 'customer'] },
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { subscriberCode: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name username subscriberCode phone role address city country')
    .limit(10)
    .lean();

    console.log(`✅ Found ${users.length} users`);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/create-order-for-user
// @desc    Create order for a member or customer (Super Admin + Sales Employee)
// @access  Private/Super Admin + Sales Employee
router.post('/create-order-for-user', protect, authorize('super_admin', 'sales_employee'), async (req, res) => {
  try {
    const {
      userId,
      items,
      shippingAddress,
      deliveryMethod, // 'pickup' or 'delivery'
      paymentMethod, // 'cash_on_delivery', 'pay_at_company'
      notes
    } = req.body;

    // Validate required fields
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'معلومات الطلبية غير مكتملة'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Calculate order total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `المنتج ${item.productId} غير موجود`
        });
      }

      // حساب السعر الفعلي للزبون (بعد الخصم إن وجد)
      let actualCustomerPrice = product.customerPrice || product.price || 0;
      if (product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice) {
        actualCustomerPrice = product.customerDiscount.discountedPrice;
      }

      // حساب السعر الفعلي للعضو (بعد الخصم إن وجد)
      let actualMemberPrice = product.subscriberPrice || product.price || 0;
      if (product.subscriberDiscount?.enabled && product.subscriberDiscount?.discountedPrice) {
        actualMemberPrice = product.subscriberDiscount.discountedPrice;
      }

      // Calculate price based on user role
      let itemPrice = user.role === 'member' ? actualMemberPrice : actualCustomerPrice;

      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productNameAr: product.nameAr,
        quantity: item.quantity,
        price: itemPrice,
        customerPriceAtPurchase: actualCustomerPrice,
        memberPriceAtPurchase: actualMemberPrice,
        points: product.points || 0
      });
    }

    // Parse shipping address
    // Handle case where user.address might be an object or string
    let addressString = shippingAddress || 'غير محدد';

    if (!shippingAddress && user.address) {
      if (typeof user.address === 'string') {
        addressString = user.address;
      } else if (typeof user.address === 'object' && user.address.street) {
        // If address is already an object, use it directly
        addressString = `${user.address.street || ''}, ${user.address.city || ''}`;
      }
    }

    const addressParts = addressString.split(',').map(s => s.trim());
    const parsedAddress = {
      street: addressParts[0] || 'غير محدد',
      city: addressParts[1] || user.city || 'غير محدد',
      state: addressParts[2] || user.city || 'غير محدد',
      zipCode: '00000',
      country: user.country || 'فلسطين'
    };

    // Create order
    const orderData = {
      user: userId,
      orderItems,
      shippingAddress: parsedAddress,
      contactPhone: user.phone || '0000000000',
      paymentMethod: paymentMethod === 'pay_at_company' ? 'cash_at_company' : paymentMethod || 'cash_on_delivery',
      itemsPrice: totalAmount,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: totalAmount,
      totalPoints: orderItems.reduce((sum, item) => sum + (item.points * item.quantity), 0),
      isPaid: paymentMethod === 'pay_at_company',
      paidAt: paymentMethod === 'pay_at_company' ? new Date() : null,
      isDelivered: paymentMethod === 'pay_at_company',
      deliveredAt: paymentMethod === 'pay_at_company' ? new Date() : null,
      status: paymentMethod === 'pay_at_company' ? 'received' : 'pending',
      notes: notes || `طلبية تم إنشاؤها بواسطة ${req.user.name}`
    };

    const order = await Order.create(orderData);

    // تحديث المخزون إذا كان الطلب بحالة مجهزة أو مستلم
    const processedStatuses = ['prepared', 'on_the_way', 'received'];
    if (processedStatuses.includes(orderData.status)) {
      for (const item of orderItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              soldCount: item.quantity,
              stock: -item.quantity
            }
          });
        }
      }
      console.log(`📦 Updated stock and soldCount for admin-created order ${order.orderNumber}`);
    }

    // If payment at company and user is member, add points immediately
    if (paymentMethod === 'pay_at_company' && user.role === 'member') {
      const totalPoints = orderItems.reduce((sum, item) => sum + (item.points * item.quantity), 0);

      if (totalPoints > 0) {
        user.monthlyPoints = (user.monthlyPoints || 0) + totalPoints;
        user.points = (user.points || 0) + totalPoints;
        await user.save();

        // تسجيل معاملة النقاط الشخصية لطلب pay_at_company
        try {
          await PointTransaction.create({
            memberId: user._id,
            points: totalPoints,
            type: 'personal',
            sourceType: 'order',
            sourceId: order._id,
            earnedAt: new Date()
          });
        } catch (ptErr) {
          console.error('PointTransaction record failed (non-critical):', ptErr.message);
        }

        console.log(`✅ Added ${totalPoints} points to member ${user.name}`);

        // توزيع نقاط الأجيال على الأعضاء العلويين
        await distributeGenerationPointsOnly(user, totalPoints);

        // Update member rank based on new points
        try {
          const rankUpdate = await updateMemberRank(userId, User);
          if (rankUpdate.updated) {
            console.log(`🎖️ Member rank updated: ${rankUpdate.oldRank} → ${rankUpdate.newRank} (${rankUpdate.rankName}) - Rank #${rankUpdate.newRankNumber}`);
          }
        } catch (error) {
          console.error('Error updating member rank:', error);
        }

        // Calculate and display downline commission (informational)
        try {
          const commission = await calculateDownlineCommission(User, userId);
          console.log(`💰 Estimated downline commission: ${commission.toFixed(2)} ₪`);
        } catch (error) {
          console.error('Error calculating downline commission:', error);
        }
      }
    }

    // Handle price difference profit AND points for customers referred by members
    if (paymentMethod === 'pay_at_company' && user.role === 'customer') {
      // Check if customer has a referring member
      const referrer = user.sponsorId || user.referredBy;

      if (referrer) {
        const referrerUser = await User.findById(referrer);

        // Only give price difference and points if referrer is a member
        if (referrerUser && referrerUser.role === 'member') {
          let totalPriceDifference = 0;
          let totalPoints = 0;

          // Calculate price difference AND points for each product
          for (const item of orderItems) {
            // استخدام الأسعار المحفوظة في الطلب
            if (item.customerPriceAtPurchase && item.memberPriceAtPurchase) {
              const priceDiff = item.customerPriceAtPurchase - item.memberPriceAtPurchase;
              totalPriceDifference += priceDiff * item.quantity;
            }

            // حساب النقاط
            if (item.points) {
              totalPoints += item.points * item.quantity;
            }
          }

          // إضافة فرق السعر مباشرة لأرباح العضو (بالعملة، ليس نقاط)
          if (totalPriceDifference > 0) {
            referrerUser.totalCommission = Math.floor((referrerUser.totalCommission || 0) + totalPriceDifference);
            referrerUser.availableCommission = Math.floor((referrerUser.availableCommission || 0) + totalPriceDifference);

            console.log(`💰 فرق السعر: العضو ${referrerUser.name} حصل على ${totalPriceDifference} شيكل من شراء العميل ${user.name}`);
          }

          // إضافة النقاط للعضو وتوزيع العمولات على شجرته
          if (totalPoints > 0) {
            // حفظ النقاط في الطلب
            await Order.findByIdAndUpdate(order._id, {
              totalPoints: totalPoints,
              referredBy: referrerUser._id // حفظ معلومات العضو المُحيل
            });

            // توزيع العمولات على شجرة العضو المُحيل
            await distributeCommissions(referrerUser, totalPoints);

            console.log(`📊 النقاط: العضو ${referrerUser.name} حصل على ${totalPoints} نقطة من شراء العميل ${user.name}`);
          }

          // حفظ التغييرات على العضو المُحيل
          await referrerUser.save();
        }
      }
    }

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name username phone subscriberCode')
      .populate('orderItems.product', 'name nameAr images');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلبية بنجاح',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order for user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== Migration: تحويل النقاط القديمة إلى PointTransaction ====================
// يُشغَّل مرة واحدة فقط بعد رفع الكود الجديد لأول مرة
router.post('/migrate-points', protect, isSuperAdmin, async (req, res) => {
  try {
    const { migrateDate } = req.body;

    if (!migrateDate) {
      return res.status(400).json({ success: false, message: 'يرجى توفير تاريخ للنقاط القديمة (migrateDate)' });
    }

    const earnedAt = new Date(migrateDate);

    // التحقق من عدم وجود migration سابقة (لمنع التكرار)
    const existing = await PointTransaction.findOne({ sourceType: 'migration' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'تم تشغيل المايغريشن مسبقاً' });
    }

    const members = await User.find({ role: 'member' })
      .select('monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    const bulkOps = [];

    for (const member of members) {
      if ((member.monthlyPoints || 0) > 0) {
        bulkOps.push({
          memberId: member._id,
          points: member.monthlyPoints,
          type: 'personal',
          sourceType: 'migration',
          earnedAt
        });
      }
      const genFields = ['generation1Points','generation2Points','generation3Points','generation4Points','generation5Points'];
      const genTypes  = ['generation1','generation2','generation3','generation4','generation5'];
      for (let i = 0; i < 5; i++) {
        const pts = member[genFields[i]] || 0;
        if (pts > 0) {
          bulkOps.push({
            memberId: member._id,
            points: pts,
            type: genTypes[i],
            sourceType: 'migration',
            earnedAt
          });
        }
      }
    }

    if (bulkOps.length > 0) {
      await PointTransaction.insertMany(bulkOps);
    }

    res.json({
      success: true,
      message: `تم تحويل نقاط ${members.length} عضو (${bulkOps.length} سجل) بتاريخ ${migrateDate}`
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/recalculate-cumulative-points
// @desc    إعادة احتساب النقاط التراكمية (user.points) لجميع الأعضاء من سجلات PointTransaction
// @access  Private/Super Admin
router.post('/recalculate-cumulative-points', protect, isSuperAdmin, async (req, res) => {
  try {
    // جمع إجمالي نقاط كل عضو من معاملاته الشخصية (personal + bonus)
    const personalTotals = await PointTransaction.aggregate([
      { $match: { type: { $in: ['personal', 'bonus'] } } },
      { $group: { _id: '$memberId', total: { $sum: '$points' } } }
    ]);

    if (personalTotals.length === 0) {
      return res.json({ success: true, message: 'لا توجد معاملات نقاط لإعادة الاحتساب', updated: 0 });
    }

    // تصفير user.points لجميع الأعضاء أولاً
    await User.updateMany({ role: 'member' }, { $set: { points: 0 } });

    let updatedCount = 0;

    for (const { _id: memberId, total } of personalTotals) {
      // إضافة النقاط للعضو نفسه
      await User.updateOne({ _id: memberId }, { $inc: { points: total } });
      updatedCount++;

      // إضافة نفس النقاط للأعضاء العلويين (5 مستويات)
      let current = await User.findById(memberId).select('referredBy role');
      for (let level = 0; level < 5; level++) {
        if (!current || !current.referredBy) break;
        const upline = await User.findOne({ _id: current.referredBy, role: 'member' }).select('_id referredBy');
        if (!upline) break;
        await User.updateOne({ _id: upline._id }, { $inc: { points: total } });
        current = upline;
      }
    }

    // تحديث الرتب بعد إعادة الاحتساب
    const { updateAllMembersRanks } = require('../config/memberRanks');
    await updateAllMembersRanks(User);

    res.json({
      success: true,
      message: `تم إعادة احتساب النقاط التراكمية لـ ${updatedCount} عضو وتحديث الرتب`,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Error recalculating cumulative points:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Settings (Logo) ───────────────────────────────────────────────────────
const Settings = require('../models/Settings');
const uploadSettings = require('../middleware/uploadSettings');

// GET logo (public)
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'global' });
    res.json({ success: true, logo: settings?.logo || '' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST upload logo (super admin)
router.post('/settings/logo', protect, isSuperAdmin, uploadSettings.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/settings/${req.file.filename}`;
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { logo: url },
      { upsert: true, new: true }
    );
    res.json({ success: true, logo: url });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
