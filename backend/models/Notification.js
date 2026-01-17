const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'welcome',
      'order_confirmation',
      'order_shipped',
      'order_delivered',
      'new_team_member',
      'team_promotion',
      'commission_earned',
      'promotion',
      'greeting',
      'achievement',
      'bonus',
      'system',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  titleAr: String,
  messageAr: String,
  isRead: {
    type: Boolean,
    default: false
  },
  link: String,
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for quick queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
