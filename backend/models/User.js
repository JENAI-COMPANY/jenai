const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'member', 'supplier', 'regional_admin', 'super_admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    uppercase: true
  },
  city: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  // Regional admin specific fields
  region: {
    type: String,
    trim: true
  },
  managedRegions: [{
    type: String,
    trim: true
  }],
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageCommissions: { type: Boolean, default: false }
  },
  // Supplier specific fields
  supplierCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  companyName: {
    type: String,
    trim: true
  },
  taxNumber: {
    type: String,
    trim: true
  },
  supplierCategory: {
    type: String,
    trim: true
  },
  // Categories that supplier can manage
  managedCategories: [{
    type: String,
    trim: true
  }],
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  totalSupplied: {
    type: Number,
    default: 0
  },
  supplierRating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  // Network marketing specific fields
  subscriberId: {
    type: String,
    unique: true,
    sparse: true
  },
  subscriberCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    length: 8
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  downline: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Member rank/degree (9 levels)
  memberRank: {
    type: Number,
    default: 1,
    min: 1,
    max: 9
  },
  // Downline commission percentages for 5 levels
  downlineCommissionRates: {
    level1: { type: Number, default: 0 }, // Direct referrals
    level2: { type: Number, default: 0 }, // Second level
    level3: { type: Number, default: 0 }, // Third level
    level4: { type: Number, default: 0 }, // Fourth level
    level5: { type: Number, default: 0 }  // Fifth level
  },
  commissionRate: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  availableCommission: {
    type: Number,
    default: 0
  },
  withdrawnCommission: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  monthlyPoints: {
    type: Number,
    default: 0
  },
  // نقاط الأجيال الخمسة
  generation1Points: {
    type: Number,
    default: 0
  },
  generation2Points: {
    type: Number,
    default: 0
  },
  generation3Points: {
    type: Number,
    default: 0
  },
  generation4Points: {
    type: Number,
    default: 0
  },
  generation5Points: {
    type: Number,
    default: 0
  },
  lastPointsReset: {
    type: Date,
    default: Date.now
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  // Referral tracking
  referralLink: String,
  referralCount: {
    type: Number,
    default: 0
  },
  // Account verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationSteps: {
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    idVerified: { type: Boolean, default: false }
  },
  // Welcome bonus tracking
  welcomeBonus: {
    received: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    expiresAt: Date
  },
  firstOrderBonus: {
    received: { type: Boolean, default: false },
    points: { type: Number, default: 10 },
    expiresAt: Date
  },
  // Favorites
  favoriteProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Activity tracking
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  activityStatus: {
    type: String,
    enum: ['active', 'inactive', 'stopped'],
    default: 'active'
  },
  // Warnings and violations
  warnings: [{
    type: String,
    date: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate unique member code (formerly subscriber code)
// Format: [Country Code 1 char][City Code 1 char][6 random digits]
userSchema.statics.generateSubscriberCode = async function(country, city) {
  const User = this;

  // Get first letter of country and city (uppercase)
  const countryCode = country ? country.charAt(0).toUpperCase() : 'X';
  const cityCode = city ? city.charAt(0).toUpperCase() : 'X';

  let isUnique = false;
  let subscriberCode = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);

    // Combine to create the 8-character code
    subscriberCode = `${countryCode}${cityCode}${randomDigits}`;

    // Check if this code already exists
    const existingUser = await User.findOne({ subscriberCode });

    if (!existingUser) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique member code. Please try again.');
  }

  return subscriberCode;
};

// Generate unique supplier code
// Format: SUP-[6 random alphanumeric characters]
userSchema.statics.generateSupplierCode = async function() {
  const User = this;

  let isUnique = false;
  let supplierCode = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6 random alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    supplierCode = `SUP-${randomStr}`;

    // Check if this code already exists
    const existingSupplier = await User.findOne({ supplierCode });

    if (!existingSupplier) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique supplier code. Please try again.');
  }

  return supplierCode;
};

module.exports = mongoose.model('User', userSchema);
