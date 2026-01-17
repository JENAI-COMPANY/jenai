const express = require('express');
const {
  getDownline,
  getNetworkStats,
  getCommissionHistory,
  getAllSubscribers,
  updateSubscriberStatus
} = require('../controllers/networkController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/downline', protect, authorize('subscriber'), getDownline);
router.get('/stats', protect, authorize('subscriber'), getNetworkStats);
router.get('/commissions', protect, authorize('subscriber'), getCommissionHistory);

// Admin routes
router.get('/subscribers', protect, authorize('admin'), getAllSubscribers);
router.put('/subscribers/:id', protect, authorize('admin'), updateSubscriberStatus);

module.exports = router;
