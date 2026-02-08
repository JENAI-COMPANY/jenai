const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  addReview,
  getReviews,
  approveReview,
  deleteReview,
  getAllReviewsAdmin
} = require('../controllers/reviewController');

// Public routes
router.get('/product/:productId', getReviews);

// Protected routes
router.post('/product/:productId', protect, addReview);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllReviewsAdmin);
router.put('/:productId/:reviewId/approve', protect, isAdmin, approveReview);
router.delete('/:productId/:reviewId', protect, isAdmin, deleteReview);

module.exports = router;
