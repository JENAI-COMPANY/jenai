const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide region name'],
    unique: true,
    trim: true
  },
  nameAr: {
    type: String,
    required: [true, 'Please provide Arabic region name'],
    trim: true
  },
  nameEn: {
    type: String,
    required: [true, 'Please provide English region name'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please provide region code'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 3
  },
  description: {
    type: String,
    trim: true
  },
  regionalAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    // إعدادات خاصة بالفرع
    currency: {
      type: String,
      default: 'ILS' // شيكل
    },
    taxRate: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      zipCode: String
    }
  },
  // الأعضاء المرتبطين بهذا الفرع
  totalMembers: {
    type: Number,
    default: 0
  },
  // إحصائيات
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// إضافة index للبحث السريع (code و name لديهم indexes تلقائية من unique: true)
regionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Region', regionSchema);
