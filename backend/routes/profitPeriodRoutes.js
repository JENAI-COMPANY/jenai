const express = require('express');
const router = express.Router();
const {
  calculatePeriodProfits,
  getAllProfitPeriods,
  getProfitPeriodById,
  getMemberProfitInPeriod,
  deleteProfitPeriod,
  updateProfitPeriodStatus,
  getMyProfitPeriods
} = require('../controllers/profitPeriodController');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/profit-periods/calculate
// @desc    احتساب أرباح فترة جديدة
// @access  Private (Admin/Super Admin only)
router.post(
  '/calculate',
  protect,
  authorize('admin', 'super_admin'),
  calculatePeriodProfits
);

// @route   GET /api/profit-periods/my-profits
// @desc    الحصول على جميع دورات الأرباح الخاصة بالعضو الحالي
// @access  Private (Member only)
router.get(
  '/my-profits',
  protect,
  authorize('member'),
  getMyProfitPeriods
);

// @route   GET /api/profit-periods
// @desc    الحصول على جميع فترات الأرباح
// @access  Private (Admin/Super Admin only)
router.get(
  '/',
  protect,
  authorize('admin', 'super_admin'),
  getAllProfitPeriods
);

// @route   GET /api/profit-periods/:id
// @desc    الحصول على تفاصيل فترة أرباح معينة
// @access  Private (Admin/Super Admin only)
router.get(
  '/:id',
  protect,
  authorize('admin', 'super_admin'),
  getProfitPeriodById
);

// @route   GET /api/profit-periods/:periodId/member/:memberId
// @desc    الحصول على أرباح عضو معين في فترة معينة
// @access  Private (Admin/Super Admin only)
router.get(
  '/:periodId/member/:memberId',
  protect,
  authorize('admin', 'super_admin'),
  getMemberProfitInPeriod
);

// @route   DELETE /api/profit-periods/:id
// @desc    حذف فترة أرباح
// @access  Private (Super Admin only)
router.delete(
  '/:id',
  protect,
  authorize('super_admin'),
  deleteProfitPeriod
);

// @route   PATCH /api/profit-periods/:id/status
// @desc    تحديث حالة فترة الأرباح
// @access  Private (Admin/Super Admin only)
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'super_admin'),
  updateProfitPeriodStatus
);

// @route   PATCH /api/profit-periods/:id/member/:memberId/payment
// @desc    تحديث حالة دفع عضو معين في فترة أرباح
// @access  Private (Admin/Super Admin only)
router.patch(
  '/:id/member/:memberId/payment',
  protect,
  authorize('admin', 'super_admin'),
  async (req, res) => {
    try {
      const { isPaid } = req.body;
      const period = await require('../models/ProfitPeriod').findById(req.params.id);
      if (!period) return res.status(404).json({ message: 'الفترة غير موجودة' });
      const member = period.membersProfits.find(m => m.memberId.toString() === req.params.memberId);
      if (!member) return res.status(404).json({ message: 'العضو غير موجود في هذه الفترة' });
      member.isPaid = isPaid;
      await period.save();
      res.json({ success: true, isPaid: member.isPaid });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   GET /api/profit-periods/snapshots/all
// @desc    الحصول على جميع النسخ الاحتياطية للنقاط
// @access  Private (Super Admin only)
router.get(
  '/snapshots/all',
  protect,
  authorize('super_admin'),
  async (req, res) => {
    try {
      const PointsSnapshot = require('../models/PointsSnapshot');
      const snapshots = await PointsSnapshot.find()
        .select('periodName periodNumber takenAt takenByName members')
        .sort({ takenAt: -1 });
      res.json({ success: true, data: snapshots });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
