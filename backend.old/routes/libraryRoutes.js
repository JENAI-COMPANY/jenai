const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin, authorize } = require('../middleware/auth');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  downloadBook,
  getBookCategories
} = require('../controllers/libraryController');

// Protected routes (subscribers and admins only)
router.get('/books', protect, authorize('subscriber', 'regional_admin', 'super_admin'), getBooks);
router.get('/books/categories', protect, authorize('subscriber', 'regional_admin', 'super_admin'), getBookCategories);
router.get('/books/:id', protect, authorize('subscriber', 'regional_admin', 'super_admin'), getBook);
router.post('/books/:id/download', protect, authorize('subscriber', 'regional_admin', 'super_admin'), downloadBook);

// Super admin routes
router.post('/books', protect, isSuperAdmin, createBook);
router.put('/books/:id', protect, isSuperAdmin, updateBook);
router.delete('/books/:id', protect, isSuperAdmin, deleteBook);

module.exports = router;
