const Product = require('../models/Product');
const User = require('../models/User');

// Add product review
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userId);

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      r => r.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      user: userId,
      userName: user.name || user.username || 'مستخدم',
      rating,
      comment,
      isApproved: false // Requires admin approval
    });

    product.calculateAverageRating();
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product reviews
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const approvedReviews = product.reviews.filter(r => r.isApproved);

    res.status(200).json({
      success: true,
      reviews: approvedReviews,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve review (Admin only)
exports.approveReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isApproved = true;
    product.calculateAverageRating();
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review approved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.reviews.pull(reviewId);
    product.calculateAverageRating();
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reviews for admin (includes unapproved)
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const products = await Product.find({ 'reviews.0': { $exists: true } })
      .select('name nameAr reviews images')
      .populate('reviews.user', 'name username phone');

    const allReviews = [];

    for (const product of products) {
      for (const review of product.reviews) {
        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          productNameAr: product.nameAr,
          productImage: product.images && product.images.length > 0 ? product.images[0] : null,
          user: review.user,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          createdAt: review.createdAt
        });
      }
    }

    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: allReviews,
      total: allReviews.length,
      pending: allReviews.filter(r => !r.isApproved).length,
      approved: allReviews.filter(r => r.isApproved).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
