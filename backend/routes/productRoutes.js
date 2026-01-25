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
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(optionalAuth, getAllProducts)
  .post(protect, isAdmin, upload.array('media', 10), createProduct);

router.get('/categories', getCategories);

router.route('/:id')
  .get(getProduct)
  .put(protect, isAdmin, upload.array('media', 10), updateProduct)
  .delete(protect, isAdmin, deleteProduct);

module.exports = router;
