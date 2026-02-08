const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  // حفظ الأسعار الفعلية وقت الطلب لحساب العمولات بشكل دقيق
  customerPriceAtPurchase: {
    type: Number,
    default: 0
  },
  memberPriceAtPurchase: {
    type: Number,
    default: 0
  },
  wholesalePriceAtPurchase: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  isBulk: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: true }
  },
  contactPhone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash_on_delivery', 'cash_at_company', 'reflect']
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  discountAmount: {
    type: Number,
    default: 0.0
  },
  couponCode: String,
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'prepared', 'on_the_way', 'received', 'cancelled'],
    default: 'pending'
  },
  // Order tracking
  tracking: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    history: [{
      status: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: String
    }]
  },
  // Custom order fields
  isCustomOrder: {
    type: Boolean,
    default: false
  },
  customOrderDetails: {
    specifications: String,
    depositAmount: Number,
    remainingAmount: Number,
    requestedDeliveryDate: Date,
    additionalNotes: String,
    adminResponse: String,
    confirmedPrice: Number,
    isConfirmed: {
      type: Boolean,
      default: false
    }
  },
  // Network marketing commission tracking
  commissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    level: Number,
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  notes: String,
  adminNotes: String,
  region: String,
  isFirstOrder: {
    type: Boolean,
    default: false
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // تتبع ما إذا تم احتساب عمولة شراء الزبون في فترة ربحية
  isCustomerCommissionCalculated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
