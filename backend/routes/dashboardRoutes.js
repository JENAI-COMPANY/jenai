const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/stats', protect, getDashboardStats);

module.exports = router;
