const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide supplier name'],
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  country: {
    type: String,
    required: [true, 'Please provide country'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide city'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  supplierCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  taxNumber: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'cosmetics', 'home', 'sports', 'other'],
    default: 'other'
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'net_15', 'net_30', 'net_60'],
    default: 'cash'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    iban: String
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  totalSupplied: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate unique supplier code
supplierSchema.statics.generateSupplierCode = async function() {
  const Supplier = this;

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
    const existingSupplier = await Supplier.findOne({ supplierCode });

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

// Pre-save hook to generate supplier code
supplierSchema.pre('save', async function(next) {
  if (!this.supplierCode) {
    this.supplierCode = await this.constructor.generateSupplierCode();
  }
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
