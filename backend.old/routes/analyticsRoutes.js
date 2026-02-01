const express = require('express');
const router = express.Router();
const {
  trackActivity,
  getActiveUsersCount,
  getActiveUsers
} = require('../controllers/analyticsController');
const { protect, isSuperAdmin } = require('../middleware/auth');

// Track user activity (public/authenticated)
router.post('/track', trackActivity);

// Get active users count (super admin only)
router.get('/active-users/count', protect, isSuperAdmin, getActiveUsersCount);

// Get detailed active users (super admin only)
router.get('/active-users', protect, isSuperAdmin, getActiveUsers);

module.exports = router;
