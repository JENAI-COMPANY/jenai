const express = require('express');
const router = express.Router();
const {
  getMyReferralLinks,
  regenerateReferralLinks,
  verifyReferralCode,
  getReferralStatistics,
  getMemberReferrals,
  getReferralLeaderboard
} = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/verify/:code', verifyReferralCode);

// Member routes (protected)
router.get('/my-links', protect, getMyReferralLinks);
router.post('/regenerate', protect, regenerateReferralLinks);
router.get('/statistics', protect, getReferralStatistics);

// Admin routes (protected)
router.get('/member/:memberId', protect, getMemberReferrals);
router.get('/leaderboard', protect, getReferralLeaderboard);

module.exports = router;
