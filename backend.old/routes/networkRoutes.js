const express = require('express');
const {
  getDownline,
  getNetworkStats,
  getCommissionHistory,
  getAllSubscribers,
  updateSubscriberStatus
} = require('../controllers/networkController');
const { protect, isSubscriber, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/downline', protect, isSubscriber, getDownline);
router.get('/stats', protect, isSubscriber, getNetworkStats);
router.get('/commissions', protect, isSubscriber, getCommissionHistory);

// Admin routes
router.get('/subscribers', protect, isAdmin, getAllSubscribers);
router.put('/subscribers/:id', protect, isAdmin, updateSubscriberStatus);

module.exports = router;
