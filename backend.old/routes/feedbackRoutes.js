const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getPendingReviews,
  getReviewsStats,
  getRegionsReviewsComparison,
  getProductReviews,
  searchReviews
} = require('../controllers/feedbackController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/feedback/reviews
 * @desc    الحصول على جميع المراجعات مع معلومات المنطقة
 * @query   status (approved/pending), regionId (للسوبر أدمن), productId, limit, page
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/reviews',
  protect,
  authorize('super_admin', 'regional_admin'),
  getAllReviews
);

/**
 * @route   GET /api/feedback/pending
 * @desc    الحصول على المراجعات المعلقة (بحاجة لموافقة)
 * @query   regionId (للسوبر أدمن)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/pending',
  protect,
  authorize('super_admin', 'regional_admin'),
  getPendingReviews
);

/**
 * @route   GET /api/feedback/stats
 * @desc    إحصائيات المراجعات
 * @query   regionId (للسوبر أدمن)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/stats',
  protect,
  authorize('super_admin', 'regional_admin'),
  getReviewsStats
);

/**
 * @route   GET /api/feedback/regions-comparison
 * @desc    مقارنة تقييمات الفروع
 * @access  Private (Super Admin only)
 */
router.get(
  '/regions-comparison',
  protect,
  authorize('super_admin'),
  getRegionsReviewsComparison
);

/**
 * @route   GET /api/feedback/product/:productId
 * @desc    مراجعات منتج معين مع معلومات المنطقة
 * @query   status (approved/pending)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/product/:productId',
  protect,
  authorize('super_admin', 'regional_admin'),
  getProductReviews
);

/**
 * @route   GET /api/feedback/search
 * @desc    البحث في المراجعات
 * @query   keyword, minRating, maxRating, regionId (للسوبر أدمن)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/search',
  protect,
  authorize('super_admin', 'regional_admin'),
  searchReviews
);

module.exports = router;
