const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Region = require('../models/Region');

/**
 * @desc    الحصول على جميع المراجعات (للسوبر أدمن والأدمن الإقليمي)
 * @route   GET /api/feedback/reviews
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { status, regionId, productId, limit = 50, page = 1 } = req.query;

    // بناء query للمنتجات حسب الصلاحيات
    let productQuery = {};

    // إذا كان regional_admin، يرى فقط مراجعات منطقته
    if (req.user.role === 'regional_admin') {
      productQuery.region = req.user.region;
    }
    // إذا كان super_admin وحدد منطقة معينة
    else if (regionId && req.user.role === 'super_admin') {
      productQuery.region = regionId;
    }

    // تصفية حسب منتج معين
    if (productId) {
      productQuery._id = productId;
    }

    // جلب المنتجات التي لديها مراجعات
    const products = await Product.find({
      ...productQuery,
      'reviews.0': { $exists: true } // فقط المنتجات التي لديها مراجعات
    })
      .populate('region', 'name nameAr code')
      .select('name sku category reviews region');

    // تجميع جميع المراجعات مع معلومات المنتج والمنطقة
    let allReviews = [];

    for (const product of products) {
      for (const review of product.reviews) {
        // تصفية حسب الحالة إذا تم تحديدها
        if (status === 'approved' && !review.isApproved) continue;
        if (status === 'pending' && review.isApproved) continue;

        // جلب معلومات المستخدم
        const user = await User.findById(review.user)
          .select('name email phone region subscriberCode')
          .populate('region', 'name nameAr code');

        allReviews.push({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          createdAt: review.createdAt,
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            region: product.region ? {
              id: product.region._id,
              name: product.region.name,
              nameAr: product.region.nameAr,
              code: product.region.code
            } : null
          },
          user: user ? {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            subscriberCode: user.subscriberCode,
            region: user.region ? {
              id: user.region._id,
              name: user.region.name,
              nameAr: user.region.nameAr,
              code: user.region.code
            } : null
          } : {
            id: review.user,
            name: review.userName || 'Unknown User'
          }
        });
      }
    }

    // ترتيب حسب التاريخ (الأحدث أولاً)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    // إحصائيات
    const stats = {
      total: allReviews.length,
      approved: allReviews.filter(r => r.isApproved).length,
      pending: allReviews.filter(r => !r.isApproved).length,
      averageRating: allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      count: paginatedReviews.length,
      total: allReviews.length,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allReviews.length / limit),
        hasMore: endIndex < allReviews.length
      },
      reviews: paginatedReviews
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على المراجعات المعلقة (تحتاج موافقة)
 * @route   GET /api/feedback/pending
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getPendingReviews = async (req, res) => {
  try {
    const { regionId } = req.query;

    let productQuery = {};

    if (req.user.role === 'regional_admin') {
      productQuery.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      productQuery.region = regionId;
    }

    const products = await Product.find({
      ...productQuery,
      'reviews.isApproved': false
    })
      .populate('region', 'name nameAr code')
      .select('name sku category reviews region');

    let pendingReviews = [];

    for (const product of products) {
      for (const review of product.reviews) {
        if (!review.isApproved) {
          const user = await User.findById(review.user)
            .select('name email phone region subscriberCode')
            .populate('region', 'name nameAr code');

          pendingReviews.push({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            product: {
              id: product._id,
              name: product.name,
              sku: product.sku,
              category: product.category,
              region: product.region ? {
                id: product.region._id,
                name: product.region.name,
                nameAr: product.region.nameAr,
                code: product.region.code
              } : null
            },
            user: user ? {
              id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              subscriberCode: user.subscriberCode,
              region: user.region ? {
                id: user.region._id,
                name: user.region.name,
                nameAr: user.region.nameAr,
                code: user.region.code
              } : null
            } : {
              id: review.user,
              name: review.userName || 'Unknown User'
            },
            productId: product._id // للموافقة/الحذف
          });
        }
      }
    }

    // ترتيب حسب التاريخ
    pendingReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: pendingReviews.length,
      reviews: pendingReviews
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reviews',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على إحصائيات المراجعات حسب المنطقة
 * @route   GET /api/feedback/stats
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getReviewsStats = async (req, res) => {
  try {
    const { regionId } = req.query;

    let productQuery = {};

    if (req.user.role === 'regional_admin') {
      productQuery.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      productQuery.region = regionId;
    }

    const products = await Product.find({
      ...productQuery,
      'reviews.0': { $exists: true }
    })
      .populate('region', 'name nameAr code')
      .select('name reviews region');

    // تجميع الإحصائيات
    let stats = {
      totalReviews: 0,
      approvedReviews: 0,
      pendingReviews: 0,
      totalProducts: products.length,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      averageRating: 0,
      recentReviews: []
    };

    let totalRatingSum = 0;

    for (const product of products) {
      for (const review of product.reviews) {
        stats.totalReviews++;

        if (review.isApproved) {
          stats.approvedReviews++;
          stats.ratingDistribution[review.rating]++;
          totalRatingSum += review.rating;
        } else {
          stats.pendingReviews++;
        }

        // أحدث 5 مراجعات
        if (stats.recentReviews.length < 5) {
          stats.recentReviews.push({
            rating: review.rating,
            comment: review.comment.substring(0, 100) + (review.comment.length > 100 ? '...' : ''),
            productName: product.name,
            isApproved: review.isApproved,
            createdAt: review.createdAt
          });
        }
      }
    }

    stats.averageRating = stats.approvedReviews > 0
      ? (totalRatingSum / stats.approvedReviews).toFixed(2)
      : 0;

    // ترتيب أحدث المراجعات
    stats.recentReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get reviews stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews stats',
      error: error.message
    });
  }
};

/**
 * @desc    مقارنة تقييمات الفروع (للسوبر أدمن فقط)
 * @route   GET /api/feedback/regions-comparison
 * @access  Private (Super Admin only)
 */
exports.getRegionsReviewsComparison = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const regions = await Region.find({ isActive: true });

    const comparison = await Promise.all(regions.map(async (region) => {
      const products = await Product.find({
        region: region._id,
        'reviews.0': { $exists: true }
      }).select('reviews');

      let stats = {
        totalReviews: 0,
        approvedReviews: 0,
        pendingReviews: 0,
        ratingSum: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      products.forEach(product => {
        product.reviews.forEach(review => {
          stats.totalReviews++;

          if (review.isApproved) {
            stats.approvedReviews++;
            stats.ratingSum += review.rating;
            stats.ratingDistribution[review.rating]++;
          } else {
            stats.pendingReviews++;
          }
        });
      });

      const averageRating = stats.approvedReviews > 0
        ? (stats.ratingSum / stats.approvedReviews).toFixed(2)
        : 0;

      return {
        region: {
          id: region._id,
          name: region.name,
          nameAr: region.nameAr,
          code: region.code
        },
        reviews: {
          total: stats.totalReviews,
          approved: stats.approvedReviews,
          pending: stats.pendingReviews
        },
        rating: {
          average: parseFloat(averageRating),
          distribution: stats.ratingDistribution
        },
        productsWithReviews: products.length
      };
    }));

    // ترتيب حسب متوسط التقييم
    comparison.sort((a, b) => b.rating.average - a.rating.average);

    res.status(200).json({
      success: true,
      regionsCount: comparison.length,
      regions: comparison
    });
  } catch (error) {
    console.error('Regions reviews comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching regions reviews comparison',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على مراجعات منتج معين مع معلومات المنطقة
 * @route   GET /api/feedback/product/:productId
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.query;

    const product = await Product.findById(productId)
      .populate('region', 'name nameAr code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'regional_admin' &&
        product.region &&
        product.region._id.toString() !== req.user.region.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view reviews for products in your region.'
      });
    }

    let reviews = product.reviews;

    // تصفية حسب الحالة
    if (status === 'approved') {
      reviews = reviews.filter(r => r.isApproved);
    } else if (status === 'pending') {
      reviews = reviews.filter(r => !r.isApproved);
    }

    // إضافة معلومات المستخدم والمنطقة
    const reviewsWithDetails = await Promise.all(reviews.map(async (review) => {
      const user = await User.findById(review.user)
        .select('name email phone region subscriberCode')
        .populate('region', 'name nameAr code');

      return {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        isApproved: review.isApproved,
        createdAt: review.createdAt,
        user: user ? {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          subscriberCode: user.subscriberCode,
          region: user.region ? {
            id: user.region._id,
            name: user.region.name,
            nameAr: user.region.nameAr,
            code: user.region.code
          } : null
        } : {
          id: review.user,
          name: review.userName || 'Unknown User'
        }
      };
    }));

    res.status(200).json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        region: product.region ? {
          id: product.region._id,
          name: product.region.name,
          nameAr: product.region.nameAr,
          code: product.region.code
        } : null,
        averageRating: product.averageRating,
        totalReviews: product.totalReviews
      },
      count: reviewsWithDetails.length,
      reviews: reviewsWithDetails
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product reviews',
      error: error.message
    });
  }
};

/**
 * @desc    البحث في المراجعات
 * @route   GET /api/feedback/search
 * @access  Private (Super Admin, Regional Admin)
 */
exports.searchReviews = async (req, res) => {
  try {
    const { keyword, minRating, maxRating, regionId } = req.query;

    let productQuery = {};

    if (req.user.role === 'regional_admin') {
      productQuery.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      productQuery.region = regionId;
    }

    const products = await Product.find({
      ...productQuery,
      'reviews.0': { $exists: true }
    })
      .populate('region', 'name nameAr code')
      .select('name sku category reviews region');

    let matchedReviews = [];

    for (const product of products) {
      for (const review of product.reviews) {
        // تصفية حسب التقييم
        if (minRating && review.rating < parseInt(minRating)) continue;
        if (maxRating && review.rating > parseInt(maxRating)) continue;

        // تصفية حسب الكلمة المفتاحية
        if (keyword) {
          const searchText = review.comment.toLowerCase();
          if (!searchText.includes(keyword.toLowerCase())) continue;
        }

        const user = await User.findById(review.user)
          .select('name email phone region subscriberCode')
          .populate('region', 'name nameAr code');

        matchedReviews.push({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          createdAt: review.createdAt,
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            region: product.region ? {
              id: product.region._id,
              name: product.region.name,
              nameAr: product.region.nameAr,
              code: product.region.code
            } : null
          },
          user: user ? {
            id: user._id,
            name: user.name,
            email: user.email,
            subscriberCode: user.subscriberCode,
            region: user.region ? {
              id: user.region._id,
              name: user.region.name,
              nameAr: user.region.nameAr,
              code: user.region.code
            } : null
          } : {
            id: review.user,
            name: review.userName || 'Unknown User'
          }
        });
      }
    }

    // ترتيب حسب التاريخ
    matchedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: matchedReviews.length,
      reviews: matchedReviews
    });
  } catch (error) {
    console.error('Search reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching reviews',
      error: error.message
    });
  }
};

module.exports = exports;
