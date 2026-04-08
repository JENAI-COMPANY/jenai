const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  description: String,
  customerPrice: { type: Number, default: 0 },
  subscriberPrice: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  stock: Number,
  images: [String],
  category: String,
  quantity: { type: Number, required: true, min: 1, default: 1 },
  selectedColor: { type: String, default: '' },
  selectedSize: { type: String, default: '' },
  customerDiscount: {
    enabled: Boolean,
    discountedPrice: Number
  },
  subscriberDiscount: {
    enabled: Boolean,
    discountedPrice: Number
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
