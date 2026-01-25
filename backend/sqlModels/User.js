const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Please provide a username' }
    },
    set(value) {
      this.setDataValue('username', value.toLowerCase().trim());
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a name' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a password' },
      len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'member', 'supplier', 'regional_admin', 'super_admin'),
    defaultValue: 'customer'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
    set(value) {
      if (value) this.setDataValue('country', value.toUpperCase().trim());
    }
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '',
    set(value) {
      if (value) this.setDataValue('city', value.toUpperCase().trim());
    }
  },
  // Address as JSON
  address: {
    type: DataTypes.JSON,
    defaultValue: {
      street: null,
      city: null,
      state: null,
      zipCode: null,
      country: null
    }
  },
  // Foreign Keys
  regionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'regions',
      key: 'id'
    }
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  // Permissions as JSON
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false,
      canViewReports: false,
      canManageCommissions: false
    }
  },
  // Supplier fields
  supplierCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    set(value) {
      if (value) this.setDataValue('supplierCode', value.toUpperCase());
    }
  },
  companyName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  taxNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  supplierCategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  managedCategories: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  paymentTerms: {
    type: DataTypes.STRING(100),
    defaultValue: 'Net 30'
  },
  totalSupplied: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  supplierRating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 5.0,
    validate: {
      min: 1,
      max: 5
    }
  },
  // Network marketing fields
  subscriberId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  subscriberCode: {
    type: DataTypes.STRING(8),
    allowNull: true,
    unique: true,
    set(value) {
      if (value) this.setDataValue('subscriberCode', value.toUpperCase());
    }
  },
  sponsorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  memberRank: {
    type: DataTypes.ENUM('agent', 'bronze', 'silver', 'gold', 'ruby', 'diamond', 'double_diamond', 'regional_ambassador', 'global_ambassador'),
    defaultValue: 'agent'
  },
  // Downline commission rates as JSON
  downlineCommissionRates: {
    type: DataTypes.JSON,
    defaultValue: {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  totalCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  availableCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  withdrawnCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  monthlyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  generation1Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  generation2Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  generation3Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  generation4Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  generation5Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  leadershipPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastPointsReset: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  referralLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  referredById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  customerReferralLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  memberReferralLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  referralCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  customerReferrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  memberReferrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Verification
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationSteps: {
    type: DataTypes.JSON,
    defaultValue: {
      emailVerified: false,
      phoneVerified: false,
      profileCompleted: false,
      idVerified: false
    }
  },
  // Welcome bonus
  welcomeBonus: {
    type: DataTypes.JSON,
    defaultValue: {
      received: false,
      points: 0,
      expiresAt: null
    }
  },
  firstOrderBonus: {
    type: DataTypes.JSON,
    defaultValue: {
      received: false,
      points: 10,
      expiresAt: null
    }
  },
  // Activity
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  activityStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'stopped'),
    defaultValue: 'active'
  },
  // Warnings
  warnings: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isSuspended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  suspensionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['username'] },
    { fields: ['subscriberCode'] },
    { fields: ['supplierCode'] },
    { fields: ['regionId'] },
    { fields: ['role'] },
    { fields: ['isActive'] }
  ],
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateReferralLinks = function(baseUrl) {
  if (!this.subscriberCode) {
    throw new Error('Member must have a subscriber code to generate referral links');
  }

  const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  this.customerReferralLink = `${frontendUrl}/register/customer?ref=${this.subscriberCode}`;
  this.memberReferralLink = `${frontendUrl}/register/member?ref=${this.subscriberCode}`;

  return {
    customerReferralLink: this.customerReferralLink,
    memberReferralLink: this.memberReferralLink,
    referralCode: this.subscriberCode
  };
};

// Static methods
User.generateSubscriberCode = async function(country, city) {
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

  const convertToEnglish = (text) => {
    if (!text || typeof text !== 'string' || text.trim() === '') return 'X';
    const firstChar = text.charAt(0);
    return arabicToEnglish[firstChar] || (firstChar ? firstChar.toUpperCase() : 'X');
  };

  const countryCode = convertToEnglish(country);
  const cityCode = convertToEnglish(city);

  let isUnique = false;
  let subscriberCode = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    subscriberCode = `${countryCode}${cityCode}${randomDigits}`;

    const existingUser = await User.findOne({ where: { subscriberCode } });

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

User.generateSupplierCode = async function() {
  let isUnique = false;
  let supplierCode = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    supplierCode = `SUP-${randomStr}`;

    const existingSupplier = await User.findOne({ where: { supplierCode } });

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

module.exports = User;
