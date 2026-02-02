const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only allow English letters, numbers, underscore, and hyphen
        return /^[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Username must contain only English letters, numbers, underscore, and hyphen'
    }
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
    enum: ['customer', 'member', 'supplier', 'regional_admin', 'category_admin', 'super_admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },
  managedRegions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  }],
  // Supplier who referred this user (for product management)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageCommissions: { type: Boolean, default: false },
    canViewMembers: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canViewProducts: { type: Boolean, default: false }
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
  // Code of the person who referred this user (string code like "LD103474")
  sponsorCode: {
    type: String,
    uppercase: true,
    trim: true
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
    type: String,
    enum: ['agent', 'bronze', 'silver', 'gold', 'ruby', 'diamond', 'double_diamond', 'regional_ambassador', 'global_ambassador'],
    default: 'agent'
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
  // نقاط عمولة القيادة
  leadershipPoints: {
    type: Number,
    default: 0
  },
  // نقاط المكافأة (تضاف يدوياً من الإدارة)
  // تُحسب للرتبة وأيضاً تُوزع على الأعضاء العلويين (مثل شراء منتج)
  bonusPoints: {
    type: Number,
    default: 0
  },
  // نقاط التعويض (تضاف يدوياً من الإدارة)
  // تُحسب للرتبة فقط ولا تُوزع على الأعضاء العلويين
  compensationPoints: {
    type: Number,
    default: 0
  },
  // نقاط الربح (للمسابقات والجوائز)
  // تُحسب كأرباح شخصية للعضو فقط (لا تُوزع على الأعضاء العلويين)
  profitPoints: {
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
  // الشخص الذي أحال هذا العضو (الراعي)
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // روابط الإحالة - نوعان: إحالة عميل وإحالة عضو
  customerReferralLink: {
    type: String,
    trim: true
  },
  memberReferralLink: {
    type: String,
    trim: true
  },
  referralCount: {
    type: Number,
    default: 0
  },
  // إحصائيات الإحالات
  customerReferrals: {
    type: Number,
    default: 0
  },
  memberReferrals: {
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

  // خريطة أسماء الدول إلى حروفها الإنجليزية الصحيحة
  const countryCodeMap = {
    'فلسطين': 'P',  // Palestine
    'الأردن': 'J',   // Jordan
    'مصر': 'E',      // Egypt
    'سوريا': 'S',    // Syria
    'لبنان': 'L',    // Lebanon
    'العراق': 'I',   // Iraq
    'السعودية': 'S', // Saudi Arabia
    'الإمارات': 'U', // UAE
    'الكويت': 'K',   // Kuwait
    'قطر': 'Q',      // Qatar
    'عمان': 'O',     // Oman
    'اليمن': 'Y',    // Yemen
    'المغرب': 'M',   // Morocco
    'الجزائر': 'A',  // Algeria
    'تونس': 'T',     // Tunisia
    'ليبيا': 'L',    // Libya
    'السودان': 'S',  // Sudan
    'palestine': 'P',
    'jordan': 'J',
    'egypt': 'E',
    'syria': 'S',
    'lebanon': 'L',
    'iraq': 'I'
  };

  // خريطة تحويل الأحرف العربية إلى الإنجليزية (للمدن والحالات غير المحددة)
  const arabicToEnglish = {
    'ا': 'A', 'أ': 'A', 'إ': 'A', 'آ': 'A',
    'ب': 'B',
    'ت': 'T', 'ث': 'T',
    'ج': 'J',
    'ح': 'H', 'خ': 'K',
    'د': 'D', 'ذ': 'D',
    'ر': 'R', 'ز': 'Z',
    'س': 'S', 'ش': 'S',
    'ص': 'S', 'ض': 'D',
    'ط': 'T', 'ظ': 'Z',
    'ع': 'A', 'غ': 'G',
    'ف': 'F',
    'ق': 'Q',
    'ك': 'K',
    'ل': 'L',
    'م': 'M',
    'ن': 'N',
    'ه': 'H',
    'و': 'W',
    'ي': 'Y', 'ى': 'Y',
    'ة': 'H'
  };

  // دالة لتحويل النص العربي إلى إنجليزي
  const convertToEnglish = (text, isCountry = false) => {
    if (!text || typeof text !== 'string' || text.trim() === '') return 'X';

    // إذا كانت دولة، تحقق من الخريطة أولاً
    if (isCountry) {
      const lowerText = text.trim().toLowerCase();
      if (countryCodeMap[lowerText]) {
        return countryCodeMap[lowerText];
      }
      // تحقق من الاسم الكامل
      if (countryCodeMap[text.trim()]) {
        return countryCodeMap[text.trim()];
      }
    }

    const firstChar = text.charAt(0);
    return arabicToEnglish[firstChar] || (firstChar ? firstChar.toUpperCase() : 'X');
  };

  // Get first letter of country and city (converted to English)
  const countryCode = convertToEnglish(country, true);  // true = isCountry
  const cityCode = convertToEnglish(city, false);

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

// Generate referral links for member
// Creates two types: customer referral and member referral
userSchema.methods.generateReferralLinks = function(baseUrl) {
  if (!this.subscriberCode) {
    throw new Error('Member must have a subscriber code to generate referral links');
  }

  const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  // Customer referral link - for referring customers
  this.customerReferralLink = `${frontendUrl}/register/customer?ref=${this.subscriberCode}`;

  // Member referral link - for referring new members
  this.memberReferralLink = `${frontendUrl}/register/member?ref=${this.subscriberCode}`;

  return {
    customerReferralLink: this.customerReferralLink,
    memberReferralLink: this.memberReferralLink,
    referralCode: this.subscriberCode
  };
};

module.exports = mongoose.model('User', userSchema);
