const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  updateSupplierRating
} = require('../controllers/supplierController');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/auth');

// All routes require authentication and admin access
router.use(protect);
router.use(isAdmin);

router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/:id')
  .get(getSupplier)
  .put(updateSupplier)
  .delete(isSuperAdmin, deleteSupplier);

router.put('/:id/status', toggleSupplierStatus);
router.put('/:id/rating', updateSupplierRating);

module.exports = router;
