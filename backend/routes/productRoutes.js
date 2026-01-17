const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getAllProducts)
  .post(protect, authorize('admin'), upload.array('media', 10), createProduct);

router.get('/categories', getCategories);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), upload.array('media', 10), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
