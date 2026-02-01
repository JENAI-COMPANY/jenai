const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyTeam, getDirectReferrals } = require('../controllers/teamController');

// Get all team members (5 levels)
router.get('/my-team', protect, getMyTeam);

// Get direct referrals only (Level 1)
router.get('/direct-referrals', protect, getDirectReferrals);

module.exports = router;
