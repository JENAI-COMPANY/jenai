const mongoose = require('mongoose');

const serviceUsageSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Guest info (when user is not logged in)
  guestName: {
    type: String,
    trim: true
  },
  guestPhone: {
    type: String,
    trim: true
  },
  // Invoice information (optional)
  invoiceAmount: {
    type: Number,
    min: 0
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  // Receipt image (proof of purchase) - optional
  receiptImage: {
    type: String
  },
  // Points earned from this usage
  pointsEarned: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
serviceUsageSchema.index({ service: 1, user: 1, status: 1 });

module.exports = mongoose.model('ServiceUsage', serviceUsageSchema);
