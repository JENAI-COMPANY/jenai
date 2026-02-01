const Product = require('../models/Product');
const Order = require('../models/Order');
const Region = require('../models/Region');
const mongoose = require('mongoose');

/**
 * @desc    الحصول على تقرير المخزون الشامل حسب الفرع
 * @route   GET /api/inventory/report
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const { regionId } = req.query;
    let query = { isActive: true };

    // إذا كان regional_admin، يرى فقط منطقته
    if (req.user.role === 'regional_admin') {
      query.region = req.user.region;
    }
    // إذا كان super_admin وحدد منطقة معينة
    else if (regionId && req.user.role === 'super_admin') {
      query.region = regionId;
    }

    // جلب المنتجات مع معلومات الفرع
    const products = await Product.find(query).populate('region', 'name nameAr code');

    // حساب الإحصائيات لكل منتج
    const inventoryReport = await Promise.all(products.map(async (product) => {
      // حساب المبيعات من الطلبات المكتملة
      const salesData = await Order.aggregate([
        {
          $match: {
            status: 'received',
            isCancelled: false,
            'orderItems.product': product._id
          }
        },
        {
          $unwind: '$orderItems'
        },
        {
          $match: {
            'orderItems.product': product._id
          }
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$orderItems.quantity' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
          }
        }
      ]);

      const sold = salesData.length > 0 ? salesData[0].totalSold : 0;
      const revenue = salesData.length > 0 ? salesData[0].totalRevenue : 0;

      // حساب الأرباح المتوقعة
      const costPerUnit = product.wholesalePrice || 0;
      const sellingPricePerUnit = product.customerPrice || 0;
      const profitPerUnit = sellingPricePerUnit - costPerUnit;
      const totalProfit = profitPerUnit * sold;

      // حساب قيمة المخزون المتبقي
      const inventoryValue = product.stock * costPerUnit;
      const potentialProfit = product.stock * profitPerUnit;

      return {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        region: product.region ? {
          id: product.region._id,
          name: product.region.name,
          nameAr: product.region.nameAr,
          code: product.region.code
        } : null,
        pricing: {
          customerPrice: product.customerPrice,
          memberPrice: product.memberPrice,
          wholesalePrice: product.wholesalePrice,
          bulkPrice: product.bulkPrice
        },
        inventory: {
          currentStock: product.stock,
          soldCount: sold,
          totalAvailable: product.stock + sold, // المخزون الأصلي
          stockPercentage: ((product.stock / (product.stock + sold)) * 100).toFixed(2)
        },
        sales: {
          totalSold: sold,
          totalRevenue: revenue.toFixed(2),
          averagePrice: sold > 0 ? (revenue / sold).toFixed(2) : 0
        },
        profit: {
          profitPerUnit: profitPerUnit.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          profitMargin: sellingPricePerUnit > 0 ? ((profitPerUnit / sellingPricePerUnit) * 100).toFixed(2) : 0
        },
        inventoryValue: {
          costValue: inventoryValue.toFixed(2),
          potentialProfit: potentialProfit.toFixed(2),
          potentialRevenue: (product.stock * sellingPricePerUnit).toFixed(2)
        },
        status: {
          isActive: product.isActive,
          isLowStock: product.stock < 10,
          isOutOfStock: product.stock === 0
        }
      };
    }));

    // حساب الإحصائيات الإجمالية
    const totalStats = inventoryReport.reduce((acc, item) => {
      return {
        totalProducts: acc.totalProducts + 1,
        totalStock: acc.totalStock + item.inventory.currentStock,
        totalSold: acc.totalSold + item.sales.totalSold,
        totalRevenue: acc.totalRevenue + parseFloat(item.sales.totalRevenue),
        totalProfit: acc.totalProfit + parseFloat(item.profit.totalProfit),
        totalInventoryValue: acc.totalInventoryValue + parseFloat(item.inventoryValue.costValue),
        lowStockItems: item.status.isLowStock ? acc.lowStockItems + 1 : acc.lowStockItems,
        outOfStockItems: item.status.isOutOfStock ? acc.outOfStockItems + 1 : acc.outOfStockItems
      };
    }, {
      totalProducts: 0,
      totalStock: 0,
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalInventoryValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    });

    res.status(200).json({
      success: true,
      count: inventoryReport.length,
      summary: {
        ...totalStats,
        totalRevenue: totalStats.totalRevenue.toFixed(2),
        totalProfit: totalStats.totalProfit.toFixed(2),
        totalInventoryValue: totalStats.totalInventoryValue.toFixed(2),
        averageProfitMargin: totalStats.totalRevenue > 0
          ? ((totalStats.totalProfit / totalStats.totalRevenue) * 100).toFixed(2)
          : 0
      },
      products: inventoryReport
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تقرير مقارنة بين الفروع (للسوبر أدمن فقط)
 * @route   GET /api/inventory/regions-comparison
 * @access  Private (Super Admin only)
 */
exports.getRegionsComparison = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const regions = await Region.find({ isActive: true });

    const comparison = await Promise.all(regions.map(async (region) => {
      // جلب منتجات الفرع
      const products = await Product.find({
        region: region._id,
        isActive: true
      });

      const productIds = products.map(p => p._id);

      // حساب المبيعات
      const salesData = await Order.aggregate([
        {
          $match: {
            status: 'received',
            isCancelled: false
          }
        },
        {
          $unwind: '$orderItems'
        },
        {
          $match: {
            'orderItems.product': { $in: productIds }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSold: { $sum: '$orderItems.quantity' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
          }
        }
      ]);

      const sales = salesData.length > 0 ? salesData[0] : {
        totalOrders: 0,
        totalSold: 0,
        totalRevenue: 0
      };

      // حساب المخزون والأرباح
      const inventoryStats = products.reduce((acc, product) => {
        const costPerUnit = product.wholesalePrice || 0;
        const sellingPrice = product.customerPrice || 0;
        const profitPerUnit = sellingPrice - costPerUnit;

        return {
          totalStock: acc.totalStock + product.stock,
          inventoryValue: acc.inventoryValue + (product.stock * costPerUnit),
          potentialRevenue: acc.potentialRevenue + (product.stock * sellingPrice),
          lowStockItems: product.stock < 10 ? acc.lowStockItems + 1 : acc.lowStockItems,
          outOfStockItems: product.stock === 0 ? acc.outOfStockItems + 1 : acc.outOfStockItems
        };
      }, {
        totalStock: 0,
        inventoryValue: 0,
        potentialRevenue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      });

      // حساب الربح الفعلي من المبيعات
      const actualProfit = await Order.aggregate([
        {
          $match: {
            status: 'received',
            isCancelled: false
          }
        },
        {
          $unwind: '$orderItems'
        },
        {
          $match: {
            'orderItems.product': { $in: productIds }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $group: {
            _id: null,
            profit: {
              $sum: {
                $multiply: [
                  { $subtract: ['$orderItems.price', '$productInfo.wholesalePrice'] },
                  '$orderItems.quantity'
                ]
              }
            }
          }
        }
      ]);

      const profit = actualProfit.length > 0 ? actualProfit[0].profit : 0;

      return {
        region: {
          id: region._id,
          name: region.name,
          nameAr: region.nameAr,
          code: region.code
        },
        products: {
          total: products.length,
          active: products.filter(p => p.isActive).length,
          lowStock: inventoryStats.lowStockItems,
          outOfStock: inventoryStats.outOfStockItems
        },
        inventory: {
          totalStock: inventoryStats.totalStock,
          inventoryValue: inventoryStats.inventoryValue.toFixed(2),
          potentialRevenue: inventoryStats.potentialRevenue.toFixed(2)
        },
        sales: {
          totalOrders: sales.totalOrders,
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue.toFixed(2),
          totalProfit: profit.toFixed(2),
          profitMargin: sales.totalRevenue > 0
            ? ((profit / sales.totalRevenue) * 100).toFixed(2)
            : 0
        },
        performance: {
          averageOrderValue: sales.totalOrders > 0
            ? (sales.totalRevenue / sales.totalOrders).toFixed(2)
            : 0,
          turnoverRate: inventoryStats.totalStock > 0
            ? ((sales.totalSold / (inventoryStats.totalStock + sales.totalSold)) * 100).toFixed(2)
            : 0
        }
      };
    }));

    // ترتيب الفروع حسب الإيرادات
    comparison.sort((a, b) => parseFloat(b.sales.totalRevenue) - parseFloat(a.sales.totalRevenue));

    // حساب الإجمالي العام
    const grandTotal = comparison.reduce((acc, region) => ({
      totalProducts: acc.totalProducts + region.products.total,
      totalStock: acc.totalStock + region.inventory.totalStock,
      totalRevenue: acc.totalRevenue + parseFloat(region.sales.totalRevenue),
      totalProfit: acc.totalProfit + parseFloat(region.sales.totalProfit),
      totalOrders: acc.totalOrders + region.sales.totalOrders
    }), {
      totalProducts: 0,
      totalStock: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalOrders: 0
    });

    res.status(200).json({
      success: true,
      regionsCount: comparison.length,
      grandTotal: {
        ...grandTotal,
        totalRevenue: grandTotal.totalRevenue.toFixed(2),
        totalProfit: grandTotal.totalProfit.toFixed(2),
        averageProfitMargin: grandTotal.totalRevenue > 0
          ? ((grandTotal.totalProfit / grandTotal.totalRevenue) * 100).toFixed(2)
          : 0
      },
      regions: comparison
    });
  } catch (error) {
    console.error('Regions comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating regions comparison',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تقرير منتج معين
 * @route   GET /api/inventory/product/:productId
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getProductInventoryReport = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate('region', 'name nameAr code');

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
        message: 'Access denied. You can only view products from your region.'
      });
    }

    // جلب بيانات المبيعات بالتفصيل
    const salesHistory = await Order.aggregate([
      {
        $match: {
          status: 'received',
          isCancelled: false
        }
      },
      {
        $unwind: '$orderItems'
      },
      {
        $match: {
          'orderItems.product': product._id
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          ordersCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    // حساب الإجمالي
    const totalSales = salesHistory.reduce((acc, item) => ({
      totalSold: acc.totalSold + item.totalSold,
      totalRevenue: acc.totalRevenue + item.totalRevenue,
      ordersCount: acc.ordersCount + item.ordersCount
    }), { totalSold: 0, totalRevenue: 0, ordersCount: 0 });

    // حساب الأرباح
    const costPerUnit = product.wholesalePrice || 0;
    const sellingPrice = product.customerPrice || 0;
    const profitPerUnit = sellingPrice - costPerUnit;
    const totalProfit = profitPerUnit * totalSales.totalSold;

    // حساب قيمة المخزون
    const inventoryValue = product.stock * costPerUnit;
    const potentialProfit = product.stock * profitPerUnit;

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
        pricing: {
          customerPrice: product.customerPrice,
          memberPrice: product.memberPrice,
          wholesalePrice: product.wholesalePrice,
          bulkPrice: product.bulkPrice
        }
      },
      inventory: {
        currentStock: product.stock,
        soldCount: totalSales.totalSold,
        totalOrders: totalSales.ordersCount,
        stockStatus: product.stock === 0 ? 'out_of_stock' : product.stock < 10 ? 'low_stock' : 'in_stock'
      },
      financial: {
        totalRevenue: totalSales.totalRevenue.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitPerUnit: profitPerUnit.toFixed(2),
        profitMargin: sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(2) : 0,
        inventoryValue: inventoryValue.toFixed(2),
        potentialProfit: potentialProfit.toFixed(2)
      },
      salesHistory: salesHistory.map(item => ({
        year: item._id.year,
        month: item._id.month,
        totalSold: item.totalSold,
        totalRevenue: item.totalRevenue.toFixed(2),
        ordersCount: item.ordersCount,
        averageOrderQuantity: (item.totalSold / item.ordersCount).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Product inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating product inventory report',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تقرير المنتجات الأكثر مبيعاً
 * @route   GET /api/inventory/top-selling
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { regionId, limit = 10 } = req.query;
    let productFilter = { isActive: true };

    // تصفية حسب الفرع
    if (req.user.role === 'regional_admin') {
      productFilter.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      productFilter.region = regionId;
    }

    const products = await Product.find(productFilter).select('_id');
    const productIds = products.map(p => p._id);

    // جلب المنتجات الأكثر مبيعاً
    const topSelling = await Order.aggregate([
      {
        $match: {
          status: 'received',
          isCancelled: false
        }
      },
      {
        $unwind: '$orderItems'
      },
      {
        $match: {
          'orderItems.product': { $in: productIds }
        }
      },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          ordersCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      }
    ]);

    const results = topSelling.map(item => {
      const profitPerUnit = (item.productInfo.customerPrice || 0) - (item.productInfo.wholesalePrice || 0);
      const totalProfit = profitPerUnit * item.totalSold;

      return {
        product: {
          id: item.productInfo._id,
          name: item.productInfo.name,
          sku: item.productInfo.sku,
          category: item.productInfo.category,
          currentStock: item.productInfo.stock
        },
        sales: {
          totalSold: item.totalSold,
          totalRevenue: item.totalRevenue.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          ordersCount: item.ordersCount,
          averageQuantityPerOrder: (item.totalSold / item.ordersCount).toFixed(2)
        }
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      products: results
    });
  } catch (error) {
    console.error('Top selling products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top selling products',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تقرير المنتجات ذات المخزون المنخفض
 * @route   GET /api/inventory/low-stock
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { regionId, threshold = 10 } = req.query;
    let query = {
      isActive: true,
      stock: { $lte: parseInt(threshold), $gt: 0 }
    };

    // تصفية حسب الفرع
    if (req.user.role === 'regional_admin') {
      query.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      query.region = regionId;
    }

    const products = await Product.find(query)
      .populate('region', 'name nameAr code')
      .sort({ stock: 1 });

    const results = products.map(product => ({
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
      inventory: {
        currentStock: product.stock,
        threshold: parseInt(threshold),
        status: 'low_stock'
      },
      pricing: {
        customerPrice: product.customerPrice,
        wholesalePrice: product.wholesalePrice
      },
      alert: {
        severity: product.stock <= 5 ? 'high' : 'medium',
        message: product.stock <= 5
          ? `فقط ${product.stock} قطع متبقية - يجب إعادة الطلب فوراً`
          : `المخزون منخفض - ${product.stock} قطع متبقية`
      }
    }));

    res.status(200).json({
      success: true,
      count: results.length,
      threshold: parseInt(threshold),
      products: results
    });
  } catch (error) {
    console.error('Low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تقرير المنتجات التي نفذت من المخزون
 * @route   GET /api/inventory/out-of-stock
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getOutOfStockProducts = async (req, res) => {
  try {
    const { regionId } = req.query;
    let query = {
      isActive: true,
      stock: 0
    };

    // تصفية حسب الفرع
    if (req.user.role === 'regional_admin') {
      query.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      query.region = regionId;
    }

    const products = await Product.find(query)
      .populate('region', 'name nameAr code')
      .sort({ updatedAt: -1 });

    // حساب المبيعات السابقة لتحديد الأولوية
    const results = await Promise.all(products.map(async (product) => {
      const salesData = await Order.aggregate([
        {
          $match: {
            status: 'received',
            isCancelled: false,
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // آخر 90 يوم
          }
        },
        {
          $unwind: '$orderItems'
        },
        {
          $match: {
            'orderItems.product': product._id
          }
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$orderItems.quantity' },
            ordersCount: { $sum: 1 }
          }
        }
      ]);

      const sales = salesData.length > 0 ? salesData[0] : { totalSold: 0, ordersCount: 0 };

      return {
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
        inventory: {
          currentStock: 0,
          status: 'out_of_stock',
          lastUpdated: product.updatedAt
        },
        recentSales: {
          last90Days: sales.totalSold,
          ordersCount: sales.ordersCount,
          averageMonthlyDemand: (sales.totalSold / 3).toFixed(2)
        },
        priority: sales.totalSold > 50 ? 'high' : sales.totalSold > 20 ? 'medium' : 'low',
        recommendation: {
          suggestedReorderQuantity: Math.ceil(sales.totalSold / 3) * 2, // شهرين من المبيعات
          message: sales.totalSold > 0
            ? `منتج مطلوب - يُنصح بطلب ${Math.ceil(sales.totalSold / 3) * 2} قطعة`
            : 'لا توجد مبيعات حديثة - قيّم الحاجة لإعادة الطلب'
        }
      };
    }));

    // ترتيب حسب الأولوية
    results.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    res.status(200).json({
      success: true,
      count: results.length,
      products: results
    });
  } catch (error) {
    console.error('Out of stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching out of stock products',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على ملخص سريع للمخزون
 * @route   GET /api/inventory/summary
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getInventorySummary = async (req, res) => {
  try {
    const { regionId } = req.query;
    let query = { isActive: true };

    // تصفية حسب الفرع
    if (req.user.role === 'regional_admin') {
      query.region = req.user.region;
    } else if (regionId && req.user.role === 'super_admin') {
      query.region = regionId;
    }

    const products = await Product.find(query);

    // حساب الإحصائيات
    const summary = {
      products: {
        total: products.length,
        inStock: products.filter(p => p.stock > 10).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock: products.filter(p => p.stock === 0).length
      },
      inventory: {
        totalItems: products.reduce((sum, p) => sum + p.stock, 0),
        totalValue: products.reduce((sum, p) => sum + (p.stock * (p.wholesalePrice || 0)), 0).toFixed(2),
        potentialRevenue: products.reduce((sum, p) => sum + (p.stock * (p.customerPrice || 0)), 0).toFixed(2)
      },
      alerts: {
        critical: products.filter(p => p.stock === 0 && p.isActive).length,
        warning: products.filter(p => p.stock > 0 && p.stock <= 5 && p.isActive).length,
        info: products.filter(p => p.stock > 5 && p.stock <= 10 && p.isActive).length
      }
    };

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error.message
    });
  }
};
