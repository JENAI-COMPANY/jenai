const mongoose = require('mongoose');

const activeUserSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index to automatically delete old sessions after 5 minutes of inactivity
activeUserSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('ActiveUser', activeUserSchema);
