const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { calculatePersonalPerformancePoints, calculateOrderPoints } = require('../utils/pointsCalculator');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    // Calculate points for members based on new system
    if (req.user.role === 'member') {
      let totalPoints = 0;
      const products = [];

      // جلب بيانات المنتجات
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          products.push(product);
        }
      }

      // حساب النقاط باستخدام النظام الجديد
      // النقاط = (سعر الجملة - سعر العضو) × الكمية × 1.5
      for (const item of orderItems) {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product && product.wholesalePrice && product.memberPrice) {
          const points = calculatePersonalPerformancePoints(
            product.wholesalePrice,
            product.memberPrice,
            item.quantity
          );
          totalPoints += points;
        }
      }

      // إضافة النقاط للعضو
      if (totalPoints > 0) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            points: totalPoints,
            monthlyPoints: totalPoints
          }
        });

        // تحديث نقاط الأجيال العليا
        await updateGenerationsPoints(req.user._id, totalPoints);
      }
    }

    // Calculate commissions if user is a subscriber
    if (req.user.role === 'subscriber' && req.user.sponsorId) {
      await calculateCommissions(order, req.user);
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث نقاط الأجيال الخمسة للأعضاء العلويين
const updateGenerationsPoints = async (memberId, points) => {
  try {
    let currentMember = await User.findById(memberId);
    let generation = 1;

    // تحديث نقاط الأجيال الخمسة
    while (currentMember && currentMember.sponsorId && generation <= 5) {
      const sponsor = await User.findById(currentMember.sponsorId);

      if (sponsor && sponsor.role === 'member') {
        const generationField = `generation${generation}Points`;

        // تحديث نقاط الجيل
        await User.findByIdAndUpdate(sponsor._id, {
          $inc: {
            [generationField]: points
          }
        });

        currentMember = sponsor;
        generation++;
      } else {
        break;
      }
    }
  } catch (error) {
    console.error('Error updating generations points:', error);
  }
};

// Calculate and assign commissions
const calculateCommissions = async (order, buyer) => {
  const commissions = [];
  let currentSponsor = await User.findById(buyer.sponsorId);
  let level = 1;

  // Calculate commissions up to 3 levels
  while (currentSponsor && level <= 3) {
    const commissionRate = level === 1 ? 10 : level === 2 ? 5 : 3;
    const commissionAmount = (order.totalPrice * commissionRate) / 100;

    commissions.push({
      user: currentSponsor._id,
      amount: commissionAmount,
      level
    });

    // Update user's total commission
    await User.findByIdAndUpdate(currentSponsor._id, {
      $inc: { totalCommission: commissionAmount }
    });

    if (currentSponsor.sponsorId) {
      currentSponsor = await User.findById(currentSponsor.sponsorId);
      level++;
    } else {
      break;
    }
  }

  // Update order with commissions
  await Order.findByIdAndUpdate(order._id, { commissions });
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged in user orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = req.body.status || order.status;

    if (req.body.status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order to paid
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.update_time,
      emailAddress: req.body.email_address
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
