const User = require('../models/User');
const Order = require('../models/Order');
const PointTransaction = require('../models/PointTransaction');
const { getRankInfo, getRankNumber } = require('../config/memberRanks');

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

    // تاريخ بداية الفترة الحالية (آخر ريست للنقاط)
    const periodStart = member.lastPointsReset || new Date(0);

    // ══════════════════════════════════════
    // 1. حساب أرباح الأداء الشخصي + الفريق
    // ══════════════════════════════════════
    // النقاط الشخصية - من PointTransactions نوع personal فقط (بدون مكافآت)
    const personalTxns = await PointTransaction.find({
      memberId: member._id,
      type: 'personal',
      earnedAt: { $gte: periodStart }
    });
    const personalPoints = personalTxns.reduce((sum, t) => sum + t.points, 0);
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = personalCommissionPoints * POINTS_TO_CURRENCY;

    // نقاط الفريق: جلب PointTransactions نوع personal فقط لكل جيل (بدون مكافآت)
    const TEAM_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];
    const genPointsRaw = [0, 0, 0, 0, 0];

    // بناء شجرة الأجيال (5 مستويات) باستخدام sponsorCode
    let currentCodes = [member.subscriberCode];
    for (let i = 0; i < 5; i++) {
      if (currentCodes.length === 0) break;
      const levelMembers = await User.find({ sponsorCode: { $in: currentCodes }, role: { $in: ['member', 'subscriber'] } })
        .select('_id subscriberCode');
      const levelIds = levelMembers.map(m => m._id);
      if (levelIds.length > 0) {
        const txns = await PointTransaction.find({
          memberId: { $in: levelIds },
          type: 'personal',
          earnedAt: { $gte: periodStart }
        });
        genPointsRaw[i] = txns.reduce((sum, t) => sum + t.points, 0);
      }
      currentCodes = levelMembers.map(m => m.subscriberCode).filter(Boolean);
    }

    const gen1Points = genPointsRaw[0];
    const gen2Points = genPointsRaw[1];
    const gen3Points = genPointsRaw[2];
    const gen4Points = genPointsRaw[3];
    const gen5Points = genPointsRaw[4];

    const teamCommissionPoints =
      gen1Points * TEAM_RATES[0] + gen2Points * TEAM_RATES[1] +
      gen3Points * TEAM_RATES[2] + gen4Points * TEAM_RATES[3] +
      gen5Points * TEAM_RATES[4];
    const teamProfitInShekel = teamCommissionPoints * POINTS_TO_CURRENCY;

    // إجمالي أرباح الأداء
    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;

    // ══════════════════════════════════════
    // 2. حساب عمولة القيادة حسب الرتبة
    // ══════════════════════════════════════
    const memberRankNumber = getRankNumber(member.memberRank);
    const rankConfig = getRankInfo(memberRankNumber);
    const leadershipRates = rankConfig?.leadershipCommission || {};
    const leadershipGenRates = [
      leadershipRates.generation1 || 0,
      leadershipRates.generation2 || 0,
      leadershipRates.generation3 || 0,
      leadershipRates.generation4 || 0,
      leadershipRates.generation5 || 0
    ];
    const leadershipCommissionPoints =
      gen1Points * leadershipGenRates[0] + gen2Points * leadershipGenRates[1] +
      gen3Points * leadershipGenRates[2] + gen4Points * leadershipGenRates[3] +
      gen5Points * leadershipGenRates[4];
    const leadershipCommission = leadershipCommissionPoints * POINTS_TO_CURRENCY;

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
    // 4. حساب الإجمالي المتوقع (بدون خصم)
    // ══════════════════════════════════════
    // الأرباح المتوقعة تُعرض بدون خصم لأنها متوقعة وليست حقيقية
    // الخصم 3% يطبق فقط عند احتساب الأرباح الحقيقي
    const totalExpectedProfit = performanceProfitInShekel + leadershipCommission + customerPurchaseCommission;

    // الناتج النهائي = الإجمالي بدون خصم
    const finalExpectedProfit = Math.floor(totalExpectedProfit);

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

        // الإجماليات (بدون خصم في الأرباح المتوقعة)
        totalBeforeDeduction: Math.floor(totalExpectedProfit),
        websiteDevelopmentCommission: 0, // لا يوجد خصم في الأرباح المتوقعة
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
          hasLeadershipCommission: leadershipCommissionPoints > 0
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في حساب الأرباح المتوقعة:', error);
    res.status(500).json({ message: 'حدث خطأ في حساب الأرباح المتوقعة' });
  }
};
