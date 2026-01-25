const express = require('express');
const {
  createRegion,
  getAllRegions,
  getRegionById,
  getRegionByCode,
  updateRegion,
  deleteRegion,
  getRegionProducts,
  getRegionMembers,
  updateRegionStats
} = require('../controllers/regionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// المسارات العامة (لا تحتاج صلاحيات)
router.get('/', getAllRegions);
router.get('/code/:code', getRegionByCode);

// المسارات المحمية (تحتاج صلاحيات الأدمن)
router.post('/',
  protect,
  authorize('super_admin'),
  createRegion
);

router.route('/:id')
  .get(getRegionById)
  .put(protect, authorize('super_admin', 'regional_admin'), updateRegion)
  .delete(protect, authorize('super_admin'), deleteRegion);

// مسارات خاصة بالفرع
router.get('/:id/products', getRegionProducts);
router.get('/:id/members',
  protect,
  authorize('super_admin', 'regional_admin'),
  getRegionMembers
);
router.put('/:id/stats',
  protect,
  authorize('super_admin', 'regional_admin'),
  updateRegionStats
);

module.exports = router;
