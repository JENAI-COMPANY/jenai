const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Check referral code and get referrer name (public route for registration)
router.get('/check-referral/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // البحث عن المستخدم بواسطة كود المشترك
    const referrer = await User.findOne({ subscriberCode: code }).select('name subscriberCode');

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Referral code not found',
        messageAr: 'كود الإحالة غير موجود'
      });
    }

    res.json({
      success: true,
      referrer: {
        name: referrer.name,
        subscriberCode: referrer.subscriberCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user by ID (for team member details)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('sponsorId', 'name subscriberCode phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
