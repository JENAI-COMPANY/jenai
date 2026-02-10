const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
} = require('../controllers/productController');
const { protect, isAdmin, optionalAuth } = require('../middleware/auth');
const {
  canViewProducts,
  canManageProducts
} = require('../middleware/permissions');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(optionalAuth, getAllProducts)
  .post(protect, isAdmin, canManageProducts, upload.array('media', 10), createProduct);

router.get('/categories', getCategories);

router.route('/:id')
  .get(optionalAuth, getProduct)
  .put(protect, isAdmin, canManageProducts, upload.array('media', 10), updateProduct)
  .delete(protect, isAdmin, canManageProducts, deleteProduct);

module.exports = router;
