const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin, isRegionalAdmin, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProfitPeriod = require('../models/ProfitPeriod');
const {
  MEMBER_RANKS,
  calculateCumulativePoints,
  countBronzeLines,
  updateMemberRank,
  updateAllMembersRanks,
  getRankInfo,
  getNextRankRequirements,
  getAllRanks,
  getDownlineStructure,
  calculateDownlineCommission
} = require('../config/memberRanks');

// @route   GET /api/admin/users
// @desc    Get all users (Super Admin and Regional Admin)
// @access  Private/Admin
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    let query = {};

    // Regional admins can only see users in their regions
    if (req.user.role === 'regional_admin') {
      query.region = { $in: req.user.managedRegions };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('sponsorId', 'name subscriberId subscriberCode')
      .sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Regional admins can only view users in their regions
    if (req.user.role === 'regional_admin') {
      if (!req.user.managedRegions.includes(user.region)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this user'
        });
      }
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Regional admins can only update users in their regions
    if (req.user.role === 'regional_admin') {
      if (!req.user.managedRegions.includes(user.region)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to update this user'
        });
      }

      // Regional admins cannot change roles or critical fields
      if (req.body.role || req.body.subscriberCode || req.body.newSponsorCode) {
        return res.status(403).json({
          success: false,
          message: 'Regional admins cannot change user roles or referral codes'
        });
      }
    }

    // Check if username is being changed and if it's unique
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ username: req.body.username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم موجود مسبقاً'
        });
      }
    }

    // Super Admin can update subscriberCode directly
    if (req.body.subscriberCode && req.user.role === 'super_admin') {
      // Check if the new subscriberCode is unique
      const existingCode = await User.findOne({
        subscriberCode: req.body.subscriberCode.toUpperCase(),
        _id: { $ne: user._id }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'كود الإحالة موجود مسبقاً'
        });
      }

      user.subscriberCode = req.body.subscriberCode.toUpperCase();
    }

    // Handle sponsor code change
    if (req.body.newSponsorCode) {
      // Only super admin can change sponsor
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'يمكن للسوبر أدمن فقط تغيير الراعي'
        });
      }

      // Find the new sponsor by their subscriberCode
      const newSponsor = await User.findOne({ subscriberCode: req.body.newSponsorCode.toUpperCase() });

      if (!newSponsor) {
        return res.status(400).json({
          success: false,
          message: 'كود الراعي غير صحيح'
        });
      }

      // Verify the new sponsor is a member or admin
      if (newSponsor.role !== 'member' && newSponsor.role !== 'super_admin' && newSponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'الراعي يجب أن يكون عضواً أو أدمن'
        });
      }

      // Prevent setting self as sponsor
      if (newSponsor._id.toString() === user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تعيين العضو كراعي لنفسه'
        });
      }

      // Remove user from old sponsor's downline
      if (user.sponsorId) {
        await User.findByIdAndUpdate(user.sponsorId, {
          $pull: { downline: user._id }
        });
      }

      // Add user to new sponsor's downline
      await User.findByIdAndUpdate(newSponsor._id, {
        $addToSet: { downline: user._id }
      });

      // Update the sponsorId
      user.sponsorId = newSponsor._id;
      delete req.body.newSponsorCode;
    }

    // Update other allowed fields
    const allowedUpdates = ['name', 'username', 'phone', 'country', 'city', 'role', 'address', 'points', 'monthlyPoints', 'totalCommission', 'availableCommission'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('sponsorId', 'name subscriberId subscriberCode');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Super Admin Only
router.put('/users/:id/role', protect, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role
    const validRoles = ['customer', 'subscriber', 'regional_admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Super Admin Only
router.delete('/users/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin'
      });
    }

    await user.remove();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (any role)
// @access  Private/Admin
router.post('/users', protect, isAdmin, async (req, res) => {
  try {
    const { username, name, password, phone, country, city, role, sponsorCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم موجود بالفعل'
      });
    }

    // Validate role
    const validRoles = ['customer', 'member', 'supplier'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نوع المستخدم غير صحيح'
      });
    }

    const userData = {
      username: username.toLowerCase(),
      name,
      password,
      phone,
      country,
      city,
      role: role || 'customer'
    };

    // Handle sponsor for member role
    if (role === 'member' && sponsorCode) {
      const sponsor = await User.findOne({ subscriberCode: sponsorCode });

      if (!sponsor) {
        return res.status(400).json({
          success: false,
          message: 'كود الراعي غير صحيح'
        });
      }

      if (sponsor.role !== 'member' && sponsor.role !== 'super_admin' && sponsor.role !== 'regional_admin') {
        return res.status(400).json({
          success: false,
          message: 'الراعي يجب أن يكون عضواً'
        });
      }

      userData.sponsorId = sponsor._id;
    }

    // Create user
    const newUser = await User.create(userData);

    // Generate subscriber code for members
    if (role === 'member') {
      newUser.subscriberCode = await User.generateSubscriberCode(country, city);
      await newUser.save();

      // Add to sponsor's downline
      if (newUser.sponsorId) {
        await User.findByIdAndUpdate(newUser.sponsorId, {
          $addToSet: { downline: newUser._id }
        });
      }
    }

    const userResponse = await User.findById(newUser._id)
      .select('-password')
      .populate('sponsorId', 'name subscriberCode');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/regional-admin
// @desc    Create regional admin
// @access  Private/Super Admin Only
router.post('/regional-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { username, name, password, email, phone, managedRegions, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const regionalAdmin = await User.create({
      username,
      name,
      password,
      email,
      phone,
      role: 'regional_admin',
      managedRegions: managedRegions || [],
      permissions: permissions || {
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
        canManageCommissions: false
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: regionalAdmin._id,
        username: regionalAdmin.username,
        name: regionalAdmin.name,
        role: regionalAdmin.role,
        managedRegions: regionalAdmin.managedRegions,
        permissions: regionalAdmin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    let userQuery = {};
    let orderQuery = {};

    // Regional admins see stats for their regions only
    if (req.user.role === 'regional_admin') {
      userQuery.region = { $in: req.user.managedRegions };
      orderQuery['user.region'] = { $in: req.user.managedRegions };
    }

    // User statistics
    const totalUsers = await User.countDocuments(userQuery);
    const totalMembers = await User.countDocuments({ ...userQuery, role: 'member' });
    const totalCustomers = await User.countDocuments({ ...userQuery, role: 'customer' });
    const totalSuppliers = await User.countDocuments({ ...userQuery, role: 'supplier' });
    const totalAdmins = await User.countDocuments({
      ...userQuery,
      role: { $in: ['regional_admin', 'super_admin'] }
    });

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const lowStockProducts = await Product.countDocuments({
      stock: { $gt: 0, $lte: 10 }
    });

    // Order statistics
    const totalOrders = await Order.countDocuments(orderQuery);
    const pendingOrders = await Order.countDocuments({ ...orderQuery, status: 'pending' });
    const processingOrders = await Order.countDocuments({ ...orderQuery, status: 'processing' });
    const shippedOrders = await Order.countDocuments({ ...orderQuery, status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ ...orderQuery, status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ ...orderQuery, status: 'cancelled' });

    // Revenue statistics
    const orders = await Order.find(orderQuery);
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = await Order.find({
      ...orderQuery,
      status: { $in: ['delivered', 'completed'] }
    });
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Commission statistics
    const totalCommissionPaid = await User.aggregate([
      { $match: userQuery },
      { $group: { _id: null, total: { $sum: '$withdrawnCommission' } } }
    ]);
    const totalCommissionPending = await User.aggregate([
      { $match: userQuery },
      { $group: { _id: null, total: { $sum: '$availableCommission' } } }
    ]);

    // Points statistics
    const totalPoints = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    const totalMonthlyPoints = await User.aggregate([
      { $match: { ...userQuery, role: 'member' } },
      { $group: { _id: null, total: { $sum: '$monthlyPoints' } } }
    ]);

    // Recent activity
    const recentUsers = await User.find(userQuery)
      .select('name username role createdAt')
      .sort('-createdAt')
      .limit(5);

    const recentOrders = await Order.find(orderQuery)
      .populate('user', 'name username')
      .select('orderNumber totalAmount status createdAt')
      .sort('-createdAt')
      .limit(5);

    // Top members by points
    const topMembers = await User.find({ ...userQuery, role: 'member' })
      .select('name username points monthlyPoints totalCommission')
      .sort('-points')
      .limit(10);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          members: totalMembers,
          customers: totalCustomers,
          suppliers: totalSuppliers,
          admins: totalAdmins
        },
        products: {
          total: totalProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
          inStock: totalProducts - outOfStockProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          total: totalRevenue,
          completed: completedRevenue,
          pending: totalRevenue - completedRevenue
        },
        commissions: {
          paid: totalCommissionPaid[0]?.total || 0,
          pending: totalCommissionPending[0]?.total || 0,
          total: (totalCommissionPaid[0]?.total || 0) + (totalCommissionPending[0]?.total || 0)
        },
        points: {
          total: totalPoints[0]?.total || 0,
          monthly: totalMonthlyPoints[0]?.total || 0
        },
        recent: {
          users: recentUsers,
          orders: recentOrders
        },
        topMembers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', protect, isAdmin, async (req, res) => {
  try {
    let query = {};

    // Regional admins can only see orders from their regions
    if (req.user.role === 'regional_admin') {
      // Build array of regions to check (include both region and managedRegions)
      let regions = [];
      if (req.user.region) {
        regions.push(req.user.region);
      }
      if (req.user.managedRegions && req.user.managedRegions.length > 0) {
        regions = regions.concat(req.user.managedRegions);
      }

      const users = await User.find({ region: { $in: regions } });
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const orders = await Order.find(query)
      .populate('user', 'username name')
      .populate('orderItems.product', 'name price')
      .sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/profits/check-period
// @desc    Check if period is available for calculation
// @access  Private/Super Admin
router.post('/profits/check-period', protect, isSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ البداية والنهاية'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية'
      });
    }

    const isAvailable = await ProfitPeriod.checkPeriodAvailable(start, end);

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'هذه الفترة تم احتسابها مسبقاً ولا يمكن احتسابها مرة أخرى'
      });
    }

    res.json({
      success: true,
      message: 'الفترة متاحة للاحتساب'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/profits/calculate
// @desc    Calculate profits for a specific period
// @access  Private/Super Admin
router.post('/profits/calculate', protect, isSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ البداية والنهاية'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Check if period is available
    const isAvailable = await ProfitPeriod.checkPeriodAvailable(start, end);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'هذه الفترة تم احتسابها مسبقاً'
      });
    }

    // Get all members
    const members = await User.find({ role: 'member' })
      .select('name username subscriberCode downline points totalCommission availableCommission');

    const membersProfits = [];
    let totalProfits = 0;

    // Calculate profits for each member
    for (const member of members) {
      // Get orders in the period
      const orders = await Order.find({
        user: member._id,
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['delivered', 'completed'] }
      });

      const orderCount = orders.length;
      const salesVolume = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Calculate points earned in this period
      let pointsEarned = 0;
      for (const order of orders) {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product && product.subscriberPrice) {
            const discount = (product.price - product.subscriberPrice) * item.quantity;
            pointsEarned += Math.floor(discount * 1.64);
          }
        }
      }

      // Get downline count
      const downlineCount = member.downline ? member.downline.length : 0;

      // Calculate downline sales
      let downlineSales = 0;
      if (downlineCount > 0) {
        const downlineOrders = await Order.find({
          user: { $in: member.downline },
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed'] }
        });
        downlineSales = downlineOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      }

      // Calculate commission earned in this period
      // This is a simplified calculation - you can adjust based on your business logic
      const commissionEarned = (salesVolume * 0.05) + (downlineSales * 0.02);

      // Calculate total profit (can be adjusted based on your formula)
      const profitAmount = commissionEarned + (pointsEarned * 0.1);

      if (orderCount > 0 || profitAmount > 0) {
        membersProfits.push({
          member: member._id,
          name: member.name,
          username: member.username,
          subscriberCode: member.subscriberCode,
          totalOrders: orderCount,
          totalSales: salesVolume,
          totalPoints: pointsEarned,
          totalCommission: commissionEarned,
          profitAmount: profitAmount,
          details: {
            orderCount,
            salesVolume,
            pointsEarned,
            commissionEarned,
            downlineCount,
            downlineSales
          }
        });

        totalProfits += profitAmount;
      }
    }

    // Create profit period record
    const profitPeriod = await ProfitPeriod.create({
      startDate: start,
      endDate: end,
      status: 'calculated',
      calculatedBy: req.user._id,
      totalProfits,
      totalMembers: membersProfits.length,
      membersProfits
    });

    res.json({
      success: true,
      message: 'تم احتساب الأرباح بنجاح',
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/profits/:id/close
// @desc    Close a profit period
// @access  Private/Super Admin
router.put('/profits/:id/close', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriod = await ProfitPeriod.findById(req.params.id);

    if (!profitPeriod) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفترة'
      });
    }

    if (profitPeriod.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'الفترة مغلقة بالفعل'
      });
    }

    profitPeriod.status = 'closed';
    await profitPeriod.save();

    res.json({
      success: true,
      message: 'تم إغلاق الفترة بنجاح',
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/profits
// @desc    Get all profit periods
// @access  Private/Super Admin
router.get('/profits', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriods = await ProfitPeriod.find()
      .populate('calculatedBy', 'name username')
      .sort('-createdAt');

    res.json({
      success: true,
      data: profitPeriods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/profits/:id
// @desc    Get single profit period
// @access  Private/Super Admin
router.get('/profits/:id', protect, isSuperAdmin, async (req, res) => {
  try {
    const profitPeriod = await ProfitPeriod.findById(req.params.id)
      .populate('calculatedBy', 'name username')
      .populate('membersProfits.member', 'name username subscriberCode');

    if (!profitPeriod) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفترة'
      });
    }

    res.json({
      success: true,
      data: profitPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/ranks
// @desc    Get all member ranks configuration
// @access  Private/Admin
router.get('/ranks', protect, isAdmin, async (req, res) => {
  try {
    const ranks = getAllRanks();
    res.json({
      success: true,
      data: ranks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id/downline
// @desc    Get user's downline structure (5 levels)
// @access  Private/Admin
router.get('/users/:id/downline', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء المشتركين'
      });
    }

    const downlineStructure = await getDownlineStructure(User, user._id);
    const downlineCommission = await calculateDownlineCommission(User, user._id);

    // Calculate total downline count
    const totalDownline = Object.values(downlineStructure).reduce(
      (sum, level) => sum + level.length,
      0
    );

    // حساب النقاط التراكمية
    const cumulativePoints = calculateCumulativePoints(user);

    // عد الخطوط البرونزية
    const bronzeLines = await countBronzeLines(user._id, User);

    res.json({
      success: true,
      data: {
        member: {
          id: user._id,
          name: user.name,
          username: user.username,
          subscriberCode: user.subscriberCode,
          memberRank: user.memberRank,
          rankConfig: getRankInfo(user.memberRank),
          points: user.points,
          monthlyPoints: user.monthlyPoints,
          cumulativePoints,
          bronzeLines
        },
        downlineStructure,
        statistics: {
          totalDownline,
          level1Count: downlineStructure.level1.length,
          level2Count: downlineStructure.level2.length,
          level3Count: downlineStructure.level3.length,
          level4Count: downlineStructure.level4.length,
          level5Count: downlineStructure.level5.length,
          estimatedDownlineCommission: downlineCommission
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/rank
// @desc    Update user's member rank
// @access  Private/Super Admin
router.put('/users/:id/rank', protect, isSuperAdmin, async (req, res) => {
  try {
    const { memberRank } = req.body;

    if (!memberRank || memberRank < 1 || memberRank > 9) {
      return res.status(400).json({
        success: false,
        message: 'الدرجة يجب أن تكون بين 1 و 9'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء المشتركين'
      });
    }

    user.memberRank = memberRank;

    // Update downline commission rates based on new rank
    const rankConfig = getRankConfig(memberRank);
    user.downlineCommissionRates = rankConfig.downlineCommissionRates;

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث درجة العضو بنجاح',
      data: {
        user: {
          id: user._id,
          name: user.name,
          memberRank: user.memberRank,
          rankConfig
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/users/update-ranks
// @desc    Auto-update all member ranks based on cumulative points and bronze lines
// @access  Private/Super Admin
router.post('/users/update-ranks', protect, isSuperAdmin, async (req, res) => {
  try {
    const result = await updateAllMembersRanks(User);

    if (result.success) {
      res.json({
        success: true,
        message: `تم تحديث ${result.updatedMembers} عضو بنجاح من أصل ${result.totalMembers}`,
        data: {
          totalMembers: result.totalMembers,
          updatedMembers: result.updatedMembers,
          updates: result.updates
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users/:id/rank-info
// @desc    Get detailed rank information for a member
// @access  Private/Admin
router.get('/users/:id/rank-info', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'هذه الميزة متاحة فقط للأعضاء'
      });
    }

    // حساب النقاط التراكمية
    const cumulativePoints = calculateCumulativePoints(user);

    // عد الخطوط البرونزية
    const bronzeLines = await countBronzeLines(user._id, User);

    // معلومات الرتبة الحالية
    const currentRankInfo = getRankInfo(user.memberRank);

    // متطلبات الرتبة التالية
    const nextRankInfo = getNextRankRequirements(
      user.memberRank,
      cumulativePoints,
      bronzeLines
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username
        },
        currentRank: {
          rank: user.memberRank,
          ...currentRankInfo
        },
        points: {
          personal: user.monthlyPoints || 0,
          generation1: user.generation1Points || 0,
          generation2: user.generation2Points || 0,
          generation3: user.generation3Points || 0,
          generation4: user.generation4Points || 0,
          generation5: user.generation5Points || 0,
          cumulative: cumulativePoints
        },
        bronzeLines: {
          count: bronzeLines,
          description: 'عدد الأعضاء البرونزيين في المستوى الأول'
        },
        nextRank: nextRankInfo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
