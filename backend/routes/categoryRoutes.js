const express = require('express');
const router = express.Router();
const {
  getCategories,
  addCategory,
  deleteCategory,
  getAllCategories
} = require('../controllers/categoryController');
const { protect, isSuperAdmin } = require('../middleware/auth');

// Public route - get active categories
router.get('/', getCategories);

// Admin routes
router.get('/all', protect, isSuperAdmin, getAllCategories);
router.post('/', protect, isSuperAdmin, addCategory);
router.delete('/:name', protect, isSuperAdmin, deleteCategory);

module.exports = router;
