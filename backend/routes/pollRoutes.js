const express = require('express');
const router = express.Router();
const {
  createPoll,
  getAllPolls,
  getPoll,
  votePoll,
  updatePoll,
  deletePoll,
  closePoll,
  getPollResults,
  getMyPolls,
  getPollStatistics
} = require('../controllers/pollController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/polls
 * @desc    الحصول على جميع الاستفتاءات
 * @query   status, scope, active
 * @access  Public (يرى الاستفتاءات العامة + استفتاءات منطقته)
 */
router.get('/', protect, getAllPolls);

/**
 * @route   POST /api/polls
 * @desc    إنشاء استفتاء جديد
 * @access  Private (Super Admin, Regional Admin)
 */
router.post(
  '/',
  protect,
  authorize('super_admin', 'regional_admin'),
  createPoll
);

/**
 * @route   GET /api/polls/my-polls
 * @desc    الحصول على استفتاءاتي (التي أنشأتها)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/my-polls',
  protect,
  authorize('super_admin', 'regional_admin'),
  getMyPolls
);

/**
 * @route   GET /api/polls/admin/statistics
 * @desc    إحصائيات الاستفتاءات
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/admin/statistics',
  protect,
  authorize('super_admin', 'regional_admin'),
  getPollStatistics
);

/**
 * @route   GET /api/polls/:id
 * @desc    الحصول على استفتاء واحد
 * @access  Public
 */
router.get('/:id', protect, getPoll);

/**
 * @route   POST /api/polls/:id/vote
 * @desc    التصويت في استفتاء
 * @body    optionIds (array)
 * @access  Private (Members)
 */
router.post('/:id/vote', protect, votePoll);

/**
 * @route   GET /api/polls/:id/results
 * @desc    الحصول على نتائج تفصيلية
 * @access  Private (Creator, Super Admin, Regional Admin)
 */
router.get(
  '/:id/results',
  protect,
  authorize('super_admin', 'regional_admin'),
  getPollResults
);

/**
 * @route   PUT /api/polls/:id
 * @desc    تحديث استفتاء
 * @access  Private (Creator or Super Admin)
 */
router.put(
  '/:id',
  protect,
  authorize('super_admin', 'regional_admin'),
  updatePoll
);

/**
 * @route   PUT /api/polls/:id/close
 * @desc    إغلاق استفتاء
 * @access  Private (Creator or Super Admin)
 */
router.put(
  '/:id/close',
  protect,
  authorize('super_admin', 'regional_admin'),
  closePoll
);

/**
 * @route   DELETE /api/polls/:id
 * @desc    حذف استفتاء
 * @access  Private (Creator or Super Admin)
 */
router.delete(
  '/:id',
  protect,
  authorize('super_admin', 'regional_admin'),
  deletePoll
);

module.exports = router;
