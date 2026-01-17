const Notification = require('../models/Notification');

// Get user's notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send notification (Admin only)
exports.sendNotification = async (req, res) => {
  try {
    const { recipients, type, title, message, titleAr, messageAr, link, data } = req.body;

    const notifications = [];

    for (const recipientId of recipients) {
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type,
        title,
        message,
        titleAr,
        messageAr,
        link,
        data
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `Notification sent to ${notifications.length} users`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create notification
exports.createNotification = async (recipientId, type, title, message, titleAr, messageAr, link = null, data = null) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      titleAr,
      messageAr,
      link,
      data
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = exports;
