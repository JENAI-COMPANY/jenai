const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'generation1', 'generation2', 'generation3', 'generation4', 'generation5', 'bonus', 'profitPoints'],
    required: true
  },
  sourceType: {
    type: String,
    enum: ['order', 'admin_bonus', 'admin_compensation', 'first_order_bonus', 'service', 'other'],
    default: 'order'
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

pointTransactionSchema.index({ memberId: 1, earnedAt: 1 });
pointTransactionSchema.index({ memberId: 1, type: 1, earnedAt: 1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
