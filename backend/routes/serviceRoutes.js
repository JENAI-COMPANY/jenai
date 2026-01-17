const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getService,
  createService,
  updateService,
  deleteService,
  addServiceReview,
  submitServiceUsage,
  getMyServiceUsage,
  getAllServiceUsage,
  reviewServiceUsage,
  getServiceCategories
} = require('../controllers/serviceController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', getAllServices);
router.get('/categories', getServiceCategories);
router.get('/:id', getService);

// Protected routes (authenticated users)
router.post('/:id/reviews', protect, addServiceReview);
router.get('/usage/my-usage', protect, getMyServiceUsage);

// Public route for service usage request (anyone can request, but track user if logged in)
router.post('/:id/usage', optionalAuth, submitServiceUsage);

// Admin routes
router.post('/', protect, authorize('super_admin', 'regional_admin'), createService);
router.put('/:id', protect, authorize('super_admin', 'regional_admin'), updateService);
router.delete('/:id', protect, authorize('super_admin', 'regional_admin'), deleteService);
router.get('/usage/all', protect, authorize('super_admin', 'regional_admin'), getAllServiceUsage);
router.put('/usage/:id/review', protect, authorize('super_admin', 'regional_admin'), reviewServiceUsage);

module.exports = router;
