const express = require('express');
const router = express.Router();
const { calculateMemberProfits, getAllMembersProfits } = require('../controllers/profitsController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/profits/my-profits
// @desc    حساب أرباح العضو
// @access  Private (Member only)
router.get('/my-profits', protect, authorize('member'), calculateMemberProfits);

// @route   GET /api/profits/all-members
// @desc    الحصول على أرباح جميع الأعضاء
// @access  Private (Admin only)
router.get('/all-members', protect, authorize('admin', 'super_admin'), getAllMembersProfits);

module.exports = router;
