const mongoose = require('mongoose');

const MemberProfitSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  memberRank: {
    type: Number,
    required: true
  },
  rankName: {
    type: String,
    required: true
  },
  rankNameEn: {
    type: String,
    required: true
  },
  points: {
    personal: { type: Number, default: 0 },
    generation1: { type: Number, default: 0 },
    generation2: { type: Number, default: 0 },
    generation3: { type: Number, default: 0 },
    generation4: { type: Number, default: 0 },
    generation5: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  commissions: {
    performance: {
      totalPoints: { type: Number, default: 0 },
      totalInShekel: { type: Number, default: 0 }
    },
    leadership: {
      totalCommissionPoints: { type: Number, default: 0 },
      commissionInShekel: { type: Number, default: 0 },
      hasLeadershipCommission: { type: Boolean, default: false }
    }
  },
  profit: {
    performanceProfit: { type: Number, default: 0 },
    leadershipProfit: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0.55 }
  }
});

const profitPeriodSchema = new mongoose.Schema({
  periodName: {
    type: String,
    required: true,
    trim: true
  },
  periodNumber: {
    type: Number,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'paid'],
    default: 'finalized'
  },
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calculatedByName: {
    type: String,
    required: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  membersProfits: [MemberProfitSchema],
  summary: {
    totalMembers: { type: Number, default: 0 },
    totalPerformanceProfits: { type: Number, default: 0 },
    totalLeadershipProfits: { type: Number, default: 0 },
    totalProfits: { type: Number, default: 0 },
    averageProfit: { type: Number, default: 0 }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
profitPeriodSchema.index({ periodNumber: -1 });
profitPeriodSchema.index({ createdAt: -1 });
profitPeriodSchema.index({ 'membersProfits.memberId': 1 });

module.exports = mongoose.model('ProfitPeriod', profitPeriodSchema);
