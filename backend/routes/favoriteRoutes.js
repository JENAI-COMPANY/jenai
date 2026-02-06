const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

// @route   GET /api/favorites
// @desc    Get user's favorite products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favoriteProducts',
        select: 'name nameAr price subscriberPrice images stock averageRating totalReviews'
      });

    res.json({
      success: true,
      data: user.favoriteProducts || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/favorites/:productId
// @desc    Add product to favorites
// @access  Private
router.post('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        messageAr: 'المنتج غير موجود'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already in favorites
    if (user.favoriteProducts.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in favorites',
        messageAr: 'المنتج موجود بالفعل في المفضلة'
      });
    }

    user.favoriteProducts.push(productId);
    await user.save();

    res.json({
      success: true,
      message: 'Product added to favorites',
      messageAr: 'تمت إضافة المنتج إلى المفضلة'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/favorites/:productId
// @desc    Remove product from favorites
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);

    // Check if in favorites
    const index = user.favoriteProducts.indexOf(productId);
    if (index === -1) {
      return res.status(400).json({
        success: false,
        message: 'Product not in favorites',
        messageAr: 'المنتج غير موجود في المفضلة'
      });
    }

    user.favoriteProducts.splice(index, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Product removed from favorites',
      messageAr: 'تمت إزالة المنتج من المفضلة'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/favorites/check/:productId
// @desc    Check if product is in favorites
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);

    const isFavorite = user.favoriteProducts.includes(productId);

    res.json({
      success: true,
      isFavorite
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
