const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Update user permissions - super admin only
router.put('/:userId/permissions', protect, authorize('super_admin'), async (req, res) => {
  try {
    console.log('🔄 Updating permissions for user:', req.params.userId);
    console.log('📋 New permissions:', req.body.permissions);

    const { permissions } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 Current user permissions:', user.permissions);

    // Update permissions - إعادة بناء الكائن بالكامل لضمان الحفظ
    const currentPermissions = user.permissions?.toObject ? user.permissions.toObject() : (user.permissions || {});
    user.permissions = {
      ...currentPermissions,
      ...permissions
    };

    // Mark permissions as modified to ensure Mongoose saves it
    user.markModified('permissions');

    console.log('✅ New user permissions:', user.permissions);

    await user.save();

    console.log('💾 Permissions saved successfully');

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
