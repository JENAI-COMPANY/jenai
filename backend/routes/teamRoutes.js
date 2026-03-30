const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyTeam, getDirectReferrals, getMemberTeam, getTeamCurrentBonusPoints } = require('../controllers/teamController');

// Get all team members (5 levels)
router.get('/my-team', protect, getMyTeam);

// Get direct referrals only (Level 1)
router.get('/direct-referrals', protect, getDirectReferrals);

// Get a specific member's team by their subscriberCode
router.get('/member-team/:subscriberCode', protect, getMemberTeam);

// Get team bonus points for current profit period
router.get('/my-team/bonus-current', protect, getTeamCurrentBonusPoints);

module.exports = router;
