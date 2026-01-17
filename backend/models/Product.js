const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  price: {
    type: Number,
    min: 0
  },
  customerPrice: {
    type: Number,
    required: [true, 'Please provide a customer price'],
    min: 0
  },
  subscriberPrice: {
    type: Number,
    required: [true, 'Please provide a subscriber price'],
    min: 0
  },
  bulkPrice: {
    type: Number,
    min: 0
  },
  bulkMinQuantity: {
    type: Number,
    default: 10,
    min: 1
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true
  },
  images: [{
    type: String
  }],
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    filename: String
  }],
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: 0,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  bulkPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  saleEndDate: {
    type: Date
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  region: {
    type: String,
    default: 'main',
    trim: true
  },
  // Custom order/reservation feature
  allowCustomOrder: {
    type: Boolean,
    default: false
  },
  customOrderDeposit: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedDeliveryDays: {
    type: Number,
    default: 7
  },
  // Reviews and ratings
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate average rating when reviews change
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const approvedReviews = this.reviews.filter(review => review.isApproved);
    if (approvedReviews.length === 0) {
      this.averageRating = 0;
      this.totalReviews = 0;
    } else {
      const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
      this.averageRating = (sum / approvedReviews.length).toFixed(1);
      this.totalReviews = approvedReviews.length;
    }
  }
};

module.exports = mongoose.model('Product', productSchema);
