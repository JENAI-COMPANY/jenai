const User = require('../models/User');
const Order = require('../models/Order');
const { calculateLeadershipCommission } = require('../config/memberRanks');

// حساب الأرباح المتوقعة (غير المحتسبة بعد)
exports.getExpectedProfit = async (req, res) => {
  try {
    const userId = req.user._id;

    // جلب بيانات العضو
    const member = await User.findById(userId);
    if (!member || member.role !== 'member') {
      return res.status(403).json({ message: 'فقط الأعضاء يمكنهم الوصول لهذه الصفحة' });
    }

    // معامل التحويل من نقاط إلى شيكل
    const POINTS_TO_CURRENCY = 0.55;

    // ══════════════════════════════════════
    // 1. حساب أرباح الأداء الشخصي + الفريق
    // ══════════════════════════════════════
    // النقاط الشخصية
    const personalPoints = member.monthlyPoints || 0;
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = Math.floor(personalCommissionPoints * POINTS_TO_CURRENCY);

    // نقاط الفريق (الأجيال)
    const gen1Points = member.generation1Points || 0;
    const gen2Points = member.generation2Points || 0;
    const gen3Points = member.generation3Points || 0;
    const gen4Points = member.generation4Points || 0;
    const gen5Points = member.generation5Points || 0;

    const teamCommissionPoints = gen1Points + gen2Points + gen3Points + gen4Points + gen5Points;
    const teamProfitInShekel = Math.floor(teamCommissionPoints * POINTS_TO_CURRENCY);

    // إجمالي أرباح الأداء
    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;

    // ══════════════════════════════════════
    // 2. حساب عمولة القيادة (دالة آمنة - قراءة فقط)
    // ══════════════════════════════════════
    const leadershipCommissionData = await calculateLeadershipCommission(User, member._id);
    const leadershipCommission = leadershipCommissionData.commissionInShekel || 0;

    // ══════════════════════════════════════
    // 3. حساب عمولة شراء الزبون (الطلبيات غير المهمشة)
    // ══════════════════════════════════════
    let customerPurchaseCommission = 0;

    // جلب طلبات الزبائن غير المهمشة فقط
    const customerOrders = await Order.find({
      referredBy: member._id,
      isDelivered: true,
      isCustomerCommissionCalculated: { $ne: true }
    }).populate('user', 'role').populate('orderItems.product');

    // حساب فرق السعر لكل طلب
    for (const order of customerOrders) {
      if (order.user && order.user.role === 'customer') {
        for (const item of order.orderItems) {
          // استخدام الأسعار المحفوظة في الطلب بدلاً من قراءتها من المنتج
          // هذا يضمن أن الحساب يعتمد على الأسعار وقت الشراء وليس الأسعار الحالية
          let actualCustomerPrice, actualSubscriberPrice;

          if (item.customerPriceAtPurchase && item.memberPriceAtPurchase) {
            // استخدام الأسعار المحفوظة (للطلبات الجديدة)
            actualCustomerPrice = item.customerPriceAtPurchase;
            actualSubscriberPrice = item.memberPriceAtPurchase;
          } else if (item.product) {
            // Fallback للطلبات القديمة التي لا تحتوي على الأسعار المحفوظة
            actualCustomerPrice = item.product.customerPrice;
            if (item.product.customerDiscount?.enabled && item.product.customerDiscount?.discountedPrice) {
              actualCustomerPrice = item.product.customerDiscount.discountedPrice;
            }

            actualSubscriberPrice = item.product.subscriberPrice;
            if (item.product.subscriberDiscount?.enabled && item.product.subscriberDiscount?.discountedPrice) {
              actualSubscriberPrice = item.product.subscriberDiscount.discountedPrice;
            }
          } else {
            continue; // تخطي هذا العنصر إذا لم تكن هناك بيانات كافية
          }

          const priceDifference = (actualCustomerPrice - actualSubscriberPrice) * item.quantity;
          customerPurchaseCommission += priceDifference;
        }
      }
    }

    // ══════════════════════════════════════
    // 4. حساب الإجمالي قبل الخصم
    // ══════════════════════════════════════
    const totalExpectedProfit = performanceProfitInShekel + leadershipCommission + customerPurchaseCommission;

    // حساب عمولة تطوير الموقع (5%)
    const websiteDevelopmentCommission = totalExpectedProfit * 0.05;

    // الناتج النهائي
    const finalExpectedProfit = Math.floor(totalExpectedProfit - websiteDevelopmentCommission);

    // إرجاع التفاصيل
    res.json({
      success: true,
      expectedProfit: {
        // أرباح الأداء
        personalProfit: personalProfitInShekel,
        teamProfit: teamProfitInShekel,
        performanceProfit: performanceProfitInShekel,

        // عمولة القيادة
        leadershipCommission: leadershipCommission,

        // عمولة شراء الزبون
        customerPurchaseCommission: Math.floor(customerPurchaseCommission),

        // الإجماليات
        totalBeforeDeduction: Math.floor(totalExpectedProfit),
        websiteDevelopmentCommission: Math.floor(websiteDevelopmentCommission),
        finalExpectedProfit: finalExpectedProfit,

        // معلومات إضافية
        details: {
          personalPoints: personalPoints,
          teamPoints: teamCommissionPoints,
          generation1Points: gen1Points,
          generation2Points: gen2Points,
          generation3Points: gen3Points,
          generation4Points: gen4Points,
          generation5Points: gen5Points,
          unprocessedCustomerOrders: customerOrders.length,
          hasLeadershipCommission: leadershipCommissionData.hasLeadershipCommission || false
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في حساب الأرباح المتوقعة:', error);
    res.status(500).json({ message: 'حدث خطأ في حساب الأرباح المتوقعة' });
  }
};
