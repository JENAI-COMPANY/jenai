const express = require('express');
const router = express.Router();
const { protect, memberOnly } = require('../middleware/auth');
const memberController = require('../controllers/memberController');

// ══════════════════════════════════════════════════════════════
// جميع المسارات محمية وللأعضاء فقط
// ══════════════════════════════════════════════════════════════

// الحصول على نقاطي وأرباحي
router.get('/points', protect, memberOnly, memberController.getMyPoints);

// الحصول على فريقي (5 أجيال) - قائمة مسطحة
router.get('/team', protect, memberOnly, memberController.getMyTeam);

// الحصول على فريقي (5 أجيال) - بنية شجرية
router.get('/team/tree', protect, memberOnly, memberController.getMyTeamTree);

module.exports = router;
