const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide service name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide service description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide service category'],
    trim: true
  },
  // Owner information
  ownerName: {
    type: String,
    required: [true, 'Please provide owner name'],
    trim: true
  },
  ownerPhone: {
    type: String,
    trim: true
  },
  ownerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Business information
  address: {
    type: String,
    required: [true, 'Please provide service address'],
    trim: true
  },
  branches: [{
    name: String,
    address: String,
    phone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  // Social media
  socialMedia: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  // Discount and points (visible to different user types)
  discountPercentage: {
    type: Number,
    required: [true, 'Please provide discount percentage'],
    min: 0,
    max: 100,
    default: 0
  },
  pointsPercentage: {
    type: Number,
    required: [true, 'Please provide points percentage'],
    min: 0,
    max: 100,
    default: 0
  },
  // Images
  images: [{
    type: String
  }],
  logo: {
    type: String
  },
  // Contract information
  contractStartDate: {
    type: Date
  },
  contractEndDate: {
    type: Date
  },
  contractDocument: {
    type: String // URL to contract document
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Usage tracking
  totalUsage: {
    type: Number,
    default: 0
  },
  // Rating
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Admin who added this service
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search
serviceSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
