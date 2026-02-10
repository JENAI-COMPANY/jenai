const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { calculatePersonalPerformancePoints, calculateOrderPoints } = require('../utils/pointsCalculator');
const { updateMemberRank } = require('../config/memberRanks');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    // التحقق من المستخدم
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: 'User not authenticated',
        messageAr: 'المستخدم غير مصادق عليه'
      });
    }

    const {
      orderItems,
      shippingAddress,
      contactPhone,
      alternatePhone,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isCustomOrder,
      customOrderDetails
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // التحقق من وجود أرقام الهاتف
    if (!contactPhone) {
      return res.status(400).json({
        message: 'Contact phone is required',
        messageAr: 'رقم الهاتف الأساسي مطلوب'
      });
    }

    // التحقق من صحة بيانات المنتجات وإضافة سعر الجملة
    for (const item of orderItems) {
      if (!item.product || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({
          message: 'Invalid order items data',
          messageAr: 'بيانات المنتجات غير صالحة'
        });
      }

      // جلب المنتج لإضافة سعر الجملة
      const product = await Product.findById(item.product);
      if (product && product.wholesalePrice !== undefined) {
        item.wholesalePriceAtPurchase = product.wholesalePrice;
      } else {
        item.wholesalePriceAtPurchase = 0;
      }
    }

    // إعداد بيانات الطلب
    const orderData = {
      user: req.user._id,
      orderItems,
      shippingAddress,
      contactPhone,
      alternatePhone: alternatePhone || '',
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isCustomOrder: isCustomOrder || false
    };

    // إضافة تفاصيل الطلب المخصص إذا وجدت
    if (isCustomOrder && customOrderDetails) {
      orderData.customOrderDetails = {
        specifications: customOrderDetails.specifications,
        requestedDeliveryDate: customOrderDetails.requestedDeliveryDate ? new Date(customOrderDetails.requestedDeliveryDate) : null,
        additionalNotes: customOrderDetails.additionalNotes || ''
      };
    }

    const order = await Order.create(orderData);

    // ═══════════════════════════════════════════════════════════════
    // حساب وحفظ النقاط في الطلب فقط - لا يتم توزيعها حتى حالة "تم الاستلام"
    // ═══════════════════════════════════════════════════════════════

    // Calculate points for members based on new system
    if (req.user.role === 'member') {
      let totalPoints = 0;

      // حساب النقاط باستخدام النظام الجديد
      for (const item of orderItems) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product && product.points) {
            totalPoints += product.points * item.quantity;
          }
        }
      }

      // حفظ النقاط في الطلب فقط (بدون توزيع)
      if (totalPoints > 0) {
        await Order.findByIdAndUpdate(order._id, {
          totalPoints: totalPoints
        });
        console.log(`📝 تم حفظ ${totalPoints} نقطة للطلب ${order.orderNumber} - سيتم توزيعها عند الاستلام`);
      }
    }

    // Handle price difference profit AND points for customers referred by members
    if (req.user.role === 'customer') {
      const referrer = req.user.sponsorId || req.user.referredBy;

      if (referrer) {
        const referrerUser = await User.findById(referrer);

        // Only calculate if referrer is a member
        if (referrerUser && referrerUser.role === 'member') {
          let totalPriceDifference = 0;
          let totalPoints = 0;

          // Calculate price difference AND points for each product
          for (const item of orderItems) {
            // حساب فرق السعر
            if (item.customerPriceAtPurchase && item.memberPriceAtPurchase) {
              const priceDiff = item.customerPriceAtPurchase - item.memberPriceAtPurchase;
              totalPriceDifference += priceDiff * item.quantity;
            }

            // حساب النقاط
            if (item.points) {
              totalPoints += item.points * item.quantity;
            }
          }

          // حفظ البيانات في الطلب فقط (بدون توزيع)
          if (totalPoints > 0 || totalPriceDifference > 0) {
            await Order.findByIdAndUpdate(order._id, {
              totalPoints: totalPoints,
              priceDifference: totalPriceDifference,
              referredBy: referrerUser._id
            });

            console.log(`📝 تم حفظ ${totalPoints} نقطة و ${totalPriceDifference} شيكل للطلب ${order.orderNumber} - سيتم توزيعها عند الاستلام`);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// دالة توزيع العمولات حسب النظام الجديد
// ══════════════════════════════════════════════════════════════
const distributeCommissions = async (buyer, productPoints) => {
  try {
    // النسب الثابتة لعمولة الأجيال (للجميع)
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02]; // 11%, 8%, 6%, 3%, 2%

    // نسب عمولة القيادة حسب الرتبة
    const LEADERSHIP_RATES = {
      'agent': [],
      'bronze': [0.05], // برونزي: جيل 1 فقط - 5%
      'silver': [0.05, 0.04], // فضي: جيل 1+2 - 5% + 4%
      'gold': [0.05, 0.04, 0.03], // ذهبي: جيل 1+2+3 - 5% + 4% + 3%
      'ruby': [0.05, 0.04, 0.03, 0.02], // ياقوتي: جيل 1+2+3+4 - 5% + 4% + 3% + 2%
      'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // ماسي: جيل 1+2+3+4+5 - 5% + 4% + 3% + 2% + 1%
      'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
      'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
    };

    // معامل التحويل من نقاط إلى شيكل
    const POINTS_TO_CURRENCY = 0.55;

    // ══════════════════════════════════════
    // 1. الربح الشخصي للمشتري (20%)
    // ══════════════════════════════════════
    const personalPoints = productPoints * 0.20;
    const personalProfit = personalPoints * POINTS_TO_CURRENCY;

    buyer.points = (buyer.points || 0) + productPoints;
    buyer.monthlyPoints = (buyer.monthlyPoints || 0) + productPoints;
    // حذف الأعشار فقط عند الحفظ النهائي
    buyer.totalCommission = Math.floor((buyer.totalCommission || 0) + personalProfit);
    buyer.availableCommission = Math.floor((buyer.availableCommission || 0) + personalProfit);
    await buyer.save();

    // تحديث رتبة المشتري تلقائياً
    await updateMemberRank(buyer._id, User);

    console.log(`💰 ${buyer.name} (المشتري) - نقاط: ${productPoints}, ربح شخصي: ${personalProfit} شيكل`);

    // ══════════════════════════════════════
    // 2. توزيع على الأجيال الخمسة
    // ══════════════════════════════════════
    let currentMemberId = buyer.referredBy;
    let generationLevel = 0;

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') break;

      // عمولة الأجيال (ثابتة)
      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = productPoints * genRate;

      // عمولة القيادة (حسب الرتبة)
      const leadershipRates = LEADERSHIP_RATES[currentMember.memberRank] || [];
      const leadershipRate = leadershipRates[generationLevel] || 0;
      const leadershipPoints = productPoints * leadershipRate;

      // إجمالي النقاط والربح (بدون حذف أعشار في الحسابات الوسيطة)
      const totalPoints = genPoints + leadershipPoints;
      const profit = totalPoints * POINTS_TO_CURRENCY;

      // تحديث العضو
      const genFieldName = `generation${generationLevel + 1}Points`;
      currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;

      if (leadershipPoints > 0) {
        currentMember.leadershipPoints = (currentMember.leadershipPoints || 0) + leadershipPoints;
      }

      // حذف الأعشار فقط عند الحفظ النهائي
      currentMember.totalCommission = Math.floor((currentMember.totalCommission || 0) + profit);
      currentMember.availableCommission = Math.floor((currentMember.availableCommission || 0) + profit);

      await currentMember.save();

      // تحديث رتبة العضو تلقائياً
      await updateMemberRank(currentMember._id, User);

      console.log(`💰 ${currentMember.name} (جيل ${generationLevel + 1}) - نقاط أجيال: ${genPoints.toFixed(2)}, نقاط قيادة: ${leadershipPoints.toFixed(2)}, ربح: ${profit} شيكل`);

      // الانتقال للجيل التالي
      currentMemberId = currentMember.referredBy;
      generationLevel++;
    }
  } catch (error) {
    console.error('❌ خطأ في توزيع العمولات:', error);
  }
};

// تحديث نقاط الأجيال الخمسة للأعضاء العلويين (تم استبدالها بـ distributeCommissions)
const updateGenerationsPoints = async (memberId, points) => {
  // هذه الدالة تم استبدالها بـ distributeCommissions
  // تم الاحتفاظ بها للتوافق مع الكود القديم
  console.log('⚠️ updateGenerationsPoints تم استبدالها بـ distributeCommissions');
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

// Export distributeCommissions to use it in admin routes
exports.distributeCommissions = distributeCommissions;

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
      .populate('orderItems.product')
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
    let query = {};

    // Regional admins can only see orders from users in their regions
    if (req.user && req.user.role === 'regional_admin') {
      const User = require('../models/User');
      // Find all users in the admin's managed regions
      const usersInRegion = await User.find({
        region: { $in: req.user.managedRegions }
      }).select('_id');

      const userIds = usersInRegion.map(u => u._id);
      query.user = { $in: userIds };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product')
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
    console.log('**************************************************');
    console.log('***** UPDATE ORDER STATUS FUNCTION CALLED *****');
    console.log('**************************************************');

    const order = await Order.findById(req.params.id).populate('user');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = req.body.status || order.status;

    console.log(`🔄 تحديث حالة الطلب ${order.orderNumber}:`);
    console.log(`   الحالة القديمة: ${oldStatus}`);
    console.log(`   الحالة الجديدة: ${req.body.status}`);
    console.log(`   النقاط المحفوظة: ${order.totalPoints}`);

    if (req.body.status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // الحالات التي تعني أن الطلب تم تجهيزه
    const processedStatuses = ['prepared', 'on_the_way', 'received'];
    const wasProcessed = processedStatuses.includes(oldStatus);
    const willBeProcessed = processedStatuses.includes(req.body.status);

    // تحديث المخزون فقط عند الانتقال من حالة غير مجهزة إلى حالة مجهزة
    if (!wasProcessed && willBeProcessed) {
      // تحديث المخزون والكمية المباعة لكل منتج
      for (const item of order.orderItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              soldCount: item.quantity,
              stock: -item.quantity
            }
          });
        }
      }
      console.log(`📦 Updated stock and soldCount for order ${order.orderNumber}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // إذا تم تغيير الحالة إلى "received" (مستلم) - توزيع النقاط والأرباح
    // ═══════════════════════════════════════════════════════════════
    console.log(`🔍 فحص شرط التوزيع: req.body.status === 'received' (${req.body.status === 'received'}) && oldStatus !== 'received' (${oldStatus !== 'received'})`);

    if (req.body.status === 'received' && oldStatus !== 'received') {
      console.log(`📥 تغيير حالة الطلب ${order.orderNumber} إلى "تم الاستلام" - بدء توزيع النقاط والأرباح`);

      const buyer = order.user;

      // ══════════════════════════════════════════════
      // حالة 1: المشتري عضو (member)
      // ══════════════════════════════════════════════
      if (buyer.role === 'member' && order.totalPoints) {
        console.log(`👤 المشتري عضو: ${buyer.name}`);

        // إعطاء 10 نقاط هدية لأول عملية شراء خلال 30 يوم من التسجيل
        if (!buyer.firstOrderBonus.received && buyer.firstOrderBonus.expiresAt) {
          const now = new Date();
          const expiresAt = new Date(buyer.firstOrderBonus.expiresAt);

          if (now <= expiresAt) {
            const bonusPoints = buyer.firstOrderBonus.points || 10;
            buyer.points = (buyer.points || 0) + bonusPoints;
            buyer.monthlyPoints = (buyer.monthlyPoints || 0) + bonusPoints;
            buyer.firstOrderBonus.received = true;
            await buyer.save();

            console.log(`🎁 ${buyer.name} حصل على ${bonusPoints} نقاط هدية لأول عملية شراء خلال 30 يوم!`);
          }
        }

        // توزيع العمولات على العضو المشتري وأجياله
        await distributeCommissions(buyer, order.totalPoints);
        console.log(`✅ تم توزيع ${order.totalPoints} نقطة للعضو ${buyer.name} وأجياله`);
      }

      // ══════════════════════════════════════════════
      // حالة 2: المشتري عميل (customer) لديه عضو مُحيل
      // ══════════════════════════════════════════════
      if (buyer.role === 'customer' && order.referredBy) {
        console.log(`👤 المشتري عميل: ${buyer.name}`);

        const referrerUser = await User.findById(order.referredBy);

        if (referrerUser && referrerUser.role === 'member') {
          console.log(`👤 العضو المُحيل: ${referrerUser.name}`);

          // إضافة فرق السعر للعضو المُحيل (إن وجد)
          if (order.priceDifference && order.priceDifference > 0) {
            referrerUser.totalCommission = Math.floor((referrerUser.totalCommission || 0) + order.priceDifference);
            referrerUser.availableCommission = Math.floor((referrerUser.availableCommission || 0) + order.priceDifference);

            console.log(`💰 فرق السعر: العضو ${referrerUser.name} حصل على ${order.priceDifference} شيكل من شراء العميل ${buyer.name}`);
          }

          // إضافة النقاط وتوزيع العمولات على شجرة العضو المُحيل
          if (order.totalPoints && order.totalPoints > 0) {
            await distributeCommissions(referrerUser, order.totalPoints);

            console.log(`📊 النقاط: العضو ${referrerUser.name} حصل على توزيع ${order.totalPoints} نقطة من شراء العميل ${buyer.name}`);
          }

          // حفظ التغييرات على العضو المُحيل
          await referrerUser.save();
        }
      }

      console.log(`✅ انتهى توزيع النقاط والأرباح للطلب ${order.orderNumber}`);
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

// تأكيد مواصفات الطلب المخصص (للآدمن فقط)
exports.confirmCustomOrderSpecs = async (req, res) => {
  try {
    console.log('🔵 confirmCustomOrderSpecs called');
    console.log('📦 Order ID:', req.params.id);
    console.log('📝 Request body:', req.body);

    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    console.log('✅ Order found:', order.orderNumber);
    console.log('📋 Is custom order:', order.isCustomOrder);

    // التحقق من أن هذا طلب مخصص
    if (!order.isCustomOrder) {
      console.log('❌ Not a custom order');
      return res.status(400).json({
        success: false,
        message: 'This is not a custom order',
        messageAr: 'هذا ليس طلب مخصص'
      });
    }

    const {
      confirmedPrice,
      requestedDeliveryDate,
      adminResponse,
      additionalNotes
    } = req.body;

    console.log('💰 Confirmed price:', confirmedPrice);

    // التحقق من وجود السعر المؤكد
    if (!confirmedPrice || confirmedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Confirmed price is required and must be greater than 0',
        messageAr: 'السعر المؤكد مطلوب ويجب أن يكون أكبر من صفر'
      });
    }

    // تحديث تفاصيل الطلب المخصص
    if (!order.customOrderDetails) {
      order.customOrderDetails = {};
    }

    // الحفاظ على المواصفات الأصلية
    const originalSpecs = order.customOrderDetails.specifications || '';
    const originalNotes = order.customOrderDetails.additionalNotes || '';

    order.customOrderDetails.confirmedPrice = parseFloat(confirmedPrice);
    order.customOrderDetails.requestedDeliveryDate = requestedDeliveryDate
      ? new Date(requestedDeliveryDate)
      : order.customOrderDetails.requestedDeliveryDate;
    order.customOrderDetails.adminResponse = adminResponse || '';
    order.customOrderDetails.additionalNotes = additionalNotes || originalNotes;
    order.customOrderDetails.specifications = originalSpecs;
    order.customOrderDetails.isConfirmed = true;

    // إخبار Mongoose أن الـ object تغير
    order.markModified('customOrderDetails');

    // تحديث السعر الإجمالي للطلب
    order.itemsPrice = parseFloat(confirmedPrice);
    order.totalPrice = parseFloat(confirmedPrice) + (order.taxPrice || 0) + (order.shippingPrice || 0);

    const updatedOrder = await order.save();

    console.log('✅ Order saved successfully');
    console.log('📊 Updated custom order details:', updatedOrder.customOrderDetails);

    res.status(200).json({
      success: true,
      message: 'Custom order specifications confirmed successfully',
      messageAr: 'تم تأكيد مواصفات الطلب المخصص بنجاح',
      order: updatedOrder
    });
  } catch (error) {
    console.error('❌ Error in confirmCustomOrderSpecs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

// إلغاء الطلب وإرجاع النقاط
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'role points monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // التحقق من أن الطلب لم يتم إلغاؤه مسبقاً
    if (order.isCancelled) {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // التحقق من أن الطلب لم يتم تسليمه
    if (order.isDelivered) {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    const { reason } = req.body;

    // إرجاع النقاط إذا كان المستخدم عضواً وتم احتساب نقاط للطلب
    if (order.user.role === 'member' && order.totalPoints > 0) {
      await reverseOrderPoints(order);
    }

    // تحديث حالة الطلب
    order.isCancelled = true;
    order.cancelledAt = Date.now();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason || 'No reason provided';
    order.status = 'cancelled';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and points have been reversed',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// دالة إرجاع النقاط عند إلغاء الطلب
const reverseOrderPoints = async (order) => {
  try {
    // حساب النقاط التي تم إضافتها للطلب
    const products = [];
    let totalPoints = 0;

    // جلب بيانات المنتجات
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        products.push(product);
      }
    }

    // حساب النقاط باستخدام نفس المعادلة
    for (const item of order.orderItems) {
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

    // خصم النقاط من العضو
    if (totalPoints > 0) {
      await User.findByIdAndUpdate(order.user._id, {
        $inc: {
          points: -totalPoints,
          monthlyPoints: -totalPoints
        }
      });

      // خصم نقاط الأجيال العليا
      await reverseGenerationsPoints(order.user._id, totalPoints);
    }

    // حفظ النقاط الملغاة في الطلب
    order.totalPoints = -totalPoints;
  } catch (error) {
    console.error('Error reversing order points:', error);
    throw error;
  }
};

// دالة خصم نقاط الأجيال الخمسة عند إلغاء الطلب
const reverseGenerationsPoints = async (memberId, points) => {
  try {
    let currentMember = await User.findById(memberId);
    let generation = 1;

    // خصم نقاط الأجيال الخمسة
    while (currentMember && currentMember.sponsorId && generation <= 5) {
      const sponsor = await User.findById(currentMember.sponsorId);

      if (sponsor && sponsor.role === 'member') {
        const generationField = `generation${generation}Points`;

        // خصم نقاط الجيل
        await User.findByIdAndUpdate(sponsor._id, {
          $inc: {
            [generationField]: -points
          }
        });

        currentMember = sponsor;
        generation++;
      } else {
        break;
      }
    }
  } catch (error) {
    console.error('Error reversing generations points:', error);
    throw error;
  }
};

// إلغاء الطلب من قبل المستخدم (فقط عندما يكون قيد الانتظار)
exports.userCancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'role points monthlyPoints');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
        messageAr: 'غير مصرح لك بإلغاء هذا الطلب'
      });
    }

    // التحقق من أن الطلب قيد الانتظار فقط
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel orders that are pending',
        messageAr: 'يمكن إلغاء الطلبات قيد الانتظار فقط'
      });
    }

    // التحقق من أن الطلب لم يتم إلغاؤه مسبقاً
    if (order.isCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
        messageAr: 'الطلب ملغي مسبقاً'
      });
    }

    const { reason } = req.body;

    // إرجاع النقاط إذا كان المستخدم عضواً وتم احتساب نقاط للطلب
    if (order.user.role === 'member' && order.totalPoints > 0) {
      await reverseOrderPoints(order);
    }

    // تحديث حالة الطلب
    order.isCancelled = true;
    order.cancelledAt = Date.now();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason || 'Cancelled by user';
    order.status = 'cancelled';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      messageAr: 'تم إلغاء الطلب بنجاح',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// تعديل الطلب من قبل المستخدم (فقط عندما يكون قيد الانتظار)
exports.userUpdateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
        messageAr: 'غير مصرح لك بتعديل هذا الطلب'
      });
    }

    // التحقق من أن الطلب قيد الانتظار فقط
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update orders that are pending',
        messageAr: 'يمكن تعديل الطلبات قيد الانتظار فقط'
      });
    }

    const {
      shippingAddress,
      contactPhone,
      alternatePhone,
      notes,
      customOrderDetails,
      orderItems
    } = req.body;

    // تحديث البيانات المسموح بها فقط
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    if (contactPhone) {
      order.contactPhone = contactPhone;
    }

    if (alternatePhone !== undefined) {
      order.alternatePhone = alternatePhone;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    // تحديث الكميات للطلبات العادية (ليست مخصصة)
    if (!order.isCustomOrder && orderItems && Array.isArray(orderItems)) {
      const Product = require('../models/Product');

      // تحديث كميات المنتجات
      const updatedItems = [];
      let newItemsPrice = 0;

      for (const item of orderItems) {
        // البحث عن المنتج الأصلي في الطلب
        const originalItem = order.orderItems.find(
          oi => oi.product.toString() === item.productId.toString()
        );

        if (originalItem) {
          // تحديث الكمية
          updatedItems.push({
            ...originalItem.toObject(),
            quantity: item.quantity
          });

          // حساب السعر الجديد
          newItemsPrice += originalItem.price * item.quantity;
        }
      }

      // تحديث عناصر الطلب
      order.orderItems = updatedItems;
      order.itemsPrice = newItemsPrice;

      // إعادة حساب السعر الكلي
      order.totalPrice = newItemsPrice + order.shippingPrice + order.taxPrice - (order.discountAmount || 0);
    }

    // تحديث تفاصيل الطلب المخصص إذا كان طلب مخصص
    if (order.isCustomOrder && customOrderDetails) {
      order.customOrderDetails = {
        ...order.customOrderDetails,
        specifications: customOrderDetails.specifications || order.customOrderDetails?.specifications,
        requestedDeliveryDate: customOrderDetails.requestedDeliveryDate ? new Date(customOrderDetails.requestedDeliveryDate) : order.customOrderDetails?.requestedDeliveryDate,
        additionalNotes: customOrderDetails.additionalNotes !== undefined ? customOrderDetails.additionalNotes : order.customOrderDetails?.additionalNotes
      };
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      messageAr: 'تم تعديل الطلب بنجاح',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// البحث في الطلبات بناءً على الاسم أو رقم العضوية
exports.searchOrders = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // البحث عن المستخدمين بناءً على الاسم أو رقم العضوية
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { subscriberCode: { $regex: query, $options: 'i' } },
        { subscriberId: { $regex: query, $options: 'i' } }
      ]
    }).select('_id');

    const userIds = users.map(user => user._id);

    // البحث عن الطلبات للمستخدمين المطابقين أو بناءً على رقم الطلب
    const orders = await Order.find({
      $or: [
        { user: { $in: userIds } },
        { orderNumber: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('user', 'name email subscriberCode subscriberId')
      .populate('orderItems.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تعديل الطلب من قبل الإدارة
exports.adminUpdateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    // التحقق من أن الطلب قيد الانتظار فقط
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update orders that are pending',
        messageAr: 'يمكن تعديل الطلبات قيد الانتظار فقط'
      });
    }

    const {
      shippingAddress,
      contactPhone,
      alternatePhone,
      notes,
      orderItems
    } = req.body;

    // تحديث البيانات
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    if (contactPhone) {
      order.contactPhone = contactPhone;
    }

    if (alternatePhone !== undefined) {
      order.alternatePhone = alternatePhone;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    // تحديث الكميات للطلبات العادية (ليست مخصصة)
    if (!order.isCustomOrder && orderItems && Array.isArray(orderItems)) {
      // تحديث كميات المنتجات
      const updatedItems = [];
      let newItemsPrice = 0;

      for (const item of orderItems) {
        // البحث عن المنتج الأصلي في الطلب
        const originalItem = order.orderItems.find(
          oi => oi.product.toString() === item.productId.toString()
        );

        if (originalItem) {
          // تحديث الكمية
          updatedItems.push({
            ...originalItem.toObject(),
            quantity: item.quantity
          });

          // حساب السعر الجديد
          newItemsPrice += originalItem.price * item.quantity;
        }
      }

      // تحديث عناصر الطلب
      order.orderItems = updatedItems;
      order.itemsPrice = newItemsPrice;

      // إعادة حساب السعر الكلي
      order.totalPrice = newItemsPrice + order.shippingPrice + order.taxPrice - (order.discountAmount || 0);
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      messageAr: 'تم تعديل الطلب بنجاح',
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
