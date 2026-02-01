const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification
} = require('../controllers/notificationController');

// User routes
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/send', protect, isAdmin, sendNotification);

module.exports = router;
