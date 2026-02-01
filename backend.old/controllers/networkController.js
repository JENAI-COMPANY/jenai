const User = require('../models/User');
const Order = require('../models/Order');

// Get downline members
exports.getDownline = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('downline', 'name email subscriberId createdAt totalCommission isActive');

    if (!user || user.role !== 'subscriber') {
      return res.status(403).json({ message: 'Only subscribers can access downline information' });
    }

    res.status(200).json({
      success: true,
      downline: user.downline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get network statistics
exports.getNetworkStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('downline');

    if (!user || user.role !== 'subscriber') {
      return res.status(403).json({ message: 'Only subscribers can access network statistics' });
    }

    // Count direct downline
    const directDownline = user.downline.length;

    // Calculate total network size (including indirect)
    let totalNetwork = directDownline;
    for (const member of user.downline) {
      const indirectMembers = await User.findById(member._id).populate('downline');
      totalNetwork += indirectMembers.downline.length;
    }

    // Get commission earnings
    const orders = await Order.find({
      'commissions.user': req.user._id
    });

    const totalEarnings = orders.reduce((sum, order) => {
      const commission = order.commissions.find(c => c.user.toString() === req.user._id.toString());
      return sum + (commission ? commission.amount : 0);
    }, 0);

    res.status(200).json({
      success: true,
      stats: {
        subscriberId: user.subscriberId,
        directDownline,
        totalNetwork,
        totalCommission: user.totalCommission,
        totalEarnings,
        commissionRate: user.commissionRate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get commission history
exports.getCommissionHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      'commissions.user': req.user._id
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const commissions = orders.map(order => {
      const commission = order.commissions.find(c => c.user.toString() === req.user._id.toString());
      return {
        orderId: order._id,
        orderDate: order.createdAt,
        buyer: order.user,
        orderTotal: order.totalPrice,
        commissionAmount: commission.amount,
        level: commission.level
      };
    });

    res.status(200).json({
      success: true,
      commissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all subscribers (Admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await User.find({ role: 'subscriber' })
      .populate('sponsorId', 'name email subscriberId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscribers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update subscriber status (Admin only)
exports.updateSubscriberStatus = async (req, res) => {
  try {
    const { isActive, commissionRate } = req.body;

    const updateData = {};
    if (typeof isActive !== 'undefined') {
      updateData.isActive = isActive;
    }
    if (commissionRate) {
      updateData.commissionRate = commissionRate;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
