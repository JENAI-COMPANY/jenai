const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  },
  region: String
}, {
  timestamps: true
});

// Index for quick date queries
visitorSchema.index({ date: 1, region: 1 }, { unique: true });

const siteStatsSchema = new mongoose.Schema({
  totalVisitors: {
    type: Number,
    default: 0
  },
  totalPageViews: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalMembers: {
    type: Number,
    default: 0
  },
  activeMembers: {
    type: Number,
    default: 0
  },
  inactiveMembers: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Visitor = mongoose.model('Visitor', visitorSchema);
const SiteStats = mongoose.model('SiteStats', siteStatsSchema);

module.exports = { Visitor, SiteStats };
