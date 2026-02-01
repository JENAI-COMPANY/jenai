const Coupon = require('../models/Coupon');

// Validate and apply coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, products, region } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({ message: 'Coupon has expired or reached usage limit' });
    }

    // Check user restrictions
    if (coupon.userRestriction === 'subscribers_only' && req.user.role !== 'subscriber') {
      return res.status(403).json({ message: 'This coupon is only for subscribers' });
    }

    if (coupon.userRestriction === 'customers_only' && req.user.role !== 'customer') {
      return res.status(403).json({ message: 'This coupon is only for customers' });
    }

    // Check per-user limit
    const userUsageCount = coupon.usedBy.filter(
      u => u.user.toString() === req.user.id
    ).length;

    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ message: 'You have reached the usage limit for this coupon' });
    }

    // Check minimum purchase
    if (orderAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        message: `Minimum purchase amount is $${coupon.minPurchaseAmount}`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply coupon to order
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired coupon' });
    }

    coupon.usedBy.push({
      user: req.user.id,
      orderAmount
    });
    coupon.usageCount += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all coupons (Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create coupon (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);

    res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update coupon (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete coupon (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
