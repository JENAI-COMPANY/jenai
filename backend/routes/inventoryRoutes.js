const express = require('express');
const router = express.Router();
const {
  getInventoryReport,
  getRegionsComparison,
  getProductInventoryReport,
  getTopSellingProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getInventorySummary
} = require('../controllers/inventoryController');

const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/inventory/summary
 * @desc    الحصول على ملخص سريع للمخزون
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/summary',
  protect,
  authorize('super_admin', 'regional_admin'),
  getInventorySummary
);

/**
 * @route   GET /api/inventory/report
 * @desc    تقرير المخزون الشامل
 * @query   regionId (اختياري للسوبر أدمن)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/report',
  protect,
  authorize('super_admin', 'regional_admin'),
  getInventoryReport
);

/**
 * @route   GET /api/inventory/regions-comparison
 * @desc    مقارنة المخزون بين جميع الفروع
 * @access  Private (Super Admin only)
 */
router.get(
  '/regions-comparison',
  protect,
  authorize('super_admin'),
  getRegionsComparison
);

/**
 * @route   GET /api/inventory/product/:productId
 * @desc    تقرير تفصيلي لمنتج معين
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/product/:productId',
  protect,
  authorize('super_admin', 'regional_admin'),
  getProductInventoryReport
);

/**
 * @route   GET /api/inventory/top-selling
 * @desc    المنتجات الأكثر مبيعاً
 * @query   regionId (اختياري), limit (default: 10)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/top-selling',
  protect,
  authorize('super_admin', 'regional_admin'),
  getTopSellingProducts
);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    المنتجات ذات المخزون المنخفض
 * @query   regionId (اختياري), threshold (default: 10)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/low-stock',
  protect,
  authorize('super_admin', 'regional_admin'),
  getLowStockProducts
);

/**
 * @route   GET /api/inventory/out-of-stock
 * @desc    المنتجات التي نفذت من المخزون
 * @query   regionId (اختياري)
 * @access  Private (Super Admin, Regional Admin)
 */
router.get(
  '/out-of-stock',
  protect,
  authorize('super_admin', 'regional_admin'),
  getOutOfStockProducts
);

module.exports = router;
