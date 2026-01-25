const express = require('express');
const router = express.Router();
const {
  sendGreetingToAll,
  sendGreetingToRegion,
  sendGreetingToMember,
  sendGreetingToMultiple,
  getGreetingsHistory,
  getGreetingTemplates
} = require('../controllers/greetingController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/greetings/templates
 * @desc    الحصول على قوالب تهاني جاهزة
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/templates',
  protect,
  authorize('super_admin', 'regional_admin'),
  getGreetingTemplates
);

/**
 * @route   GET /api/greetings/history
 * @desc    سجل التهاني المرسلة
 * @query   limit, page
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/history',
  protect,
  authorize('super_admin', 'regional_admin'),
  getGreetingsHistory
);

/**
 * @route   POST /api/greetings/send-all
 * @desc    إرسال تهنئة لجميع الأعضاء
 * @access  Private (Super Admin only)
 */
router.post(
  '/send-all',
  protect,
  authorize('super_admin'),
  sendGreetingToAll
);

/**
 * @route   POST /api/greetings/send-region
 * @desc    إرسال تهنئة لأعضاء منطقة معينة
 * @body    regionId (للسوبر أدمن فقط)
 * @access  Private (Super Admin, Regional Admin)
 */
router.post(
  '/send-region',
  protect,
  authorize('super_admin', 'regional_admin'),
  sendGreetingToRegion
);

/**
 * @route   POST /api/greetings/send-to-member
 * @desc    إرسال تهنئة لشخص محدد
 * @body    userId, title, message
 * @access  Private (Super Admin, Regional Admin)
 */
router.post(
  '/send-to-member',
  protect,
  authorize('super_admin', 'regional_admin'),
  sendGreetingToMember
);

/**
 * @route   POST /api/greetings/send-to-multiple
 * @desc    إرسال تهنئة لمجموعة محددة
 * @body    userIds (array), title, message
 * @access  Private (Super Admin, Regional Admin)
 */
router.post(
  '/send-to-multiple',
  protect,
  authorize('super_admin', 'regional_admin'),
  sendGreetingToMultiple
);

module.exports = router;
