const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PointTransaction = require('../models/PointTransaction');
const { calculateTotalPoints } = require('../utils/pointsCalculator');
const { calculateNetworkCommissions, getRankInfo, getRankNumber } = require('../config/memberRanks');

/**
 * احتساب وحفظ أرباح جميع الأعضاء لفترة معينة
 */
exports.calculatePeriodProfits = async (req, res) => {
  try {
    const { periodName, startDate, endDate, notes } = req.body;

    // التحقق من البيانات المطلوبة
    if (!periodName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير اسم الدورة، تاريخ البداية، وتاريخ النهاية'
      });
    }

    // توليد رقم الدورة تلقائياً (العد من 1)
    const lastPeriod = await ProfitPeriod.findOne().sort({ periodNumber: -1 });
    const periodNumber = lastPeriod ? (lastPeriod.periodNumber || 0) + 1 : 1;

    // جلب جميع الأعضاء
    const members = await User.find({ role: 'member' })
      .select('name username memberRank');

    // حساب النقاط من معاملات النقاط ضمن نطاق التواريخ المحدد
    const endDateObj2 = new Date(endDate);
    endDateObj2.setHours(23, 59, 59, 999);

    const pointsAgg = await PointTransaction.aggregate([
      {
        $match: {
          earnedAt: { $gte: new Date(startDate), $lte: endDateObj2 }
        }
      },
      {
        $group: {
          _id: { memberId: '$memberId', type: '$type' },
          total: { $sum: '$points' }
        }
      }
    ]);

    // بناء خريطة النقاط لكل عضو
    const pointsMap = {};
    for (const t of pointsAgg) {
      const id = t._id.memberId.toString();
      if (!pointsMap[id]) pointsMap[id] = {};
      pointsMap[id][t._id.type] = (pointsMap[id][t._id.type] || 0) + t.total;
    }

    const membersProfits = [];
    let totalPerformanceProfits = 0;
    let totalLeadershipProfits = 0;
    let totalProfits = 0;

    // حساب أرباح كل عضو
    for (const member of members) {
      const memberPoints = pointsMap[member._id.toString()] || {};
      // النقاط الشخصية: من طلبيات العضو + المكافآت ضمن التواريخ
      const personalPoints = (memberPoints['personal'] || 0) + (memberPoints['bonus'] || 0);

      // حساب أرباح الأداء الشخصي: نقاط × 20% × 0.55
      const personalCommissionPoints = personalPoints * 0.20;
      const personalProfitInShekel = Math.floor(personalCommissionPoints * 0.55);

      // حساب عمولات الشبكة (فريق + قيادة) من مصدر موحد (personal+bonus للشبكة ضمن التواريخ)
      const networkCommissions = await calculateNetworkCommissions(User, member._id, startDate, endDate);
      const teamCommissionPoints = networkCommissions.team.totalCommissionPoints;
      const teamProfitInShekel = networkCommissions.team.commissionInShekel;
      const leadershipCommission = networkCommissions.leadership;

      // إجمالي أرباح الأداء
      const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;
      const totalCommissionPoints = personalCommissionPoints + teamCommissionPoints;

      const memberRankNumber = getRankNumber(member.memberRank);
      const rankInfo = getRankInfo(memberRankNumber);

      // حساب عمولة شراء الزبون (فرق السعر بين زبون وعضو)
      let customerPurchaseCommission = 0;

      // Debug: طباعة معلومات الاستعلام
      console.log(`\n🔍 البحث عن طلبات الزبائن للعضو ${member.name} (${member._id})`);
      console.log(`   📅 من تاريخ: ${startDate}`);
      console.log(`   📅 إلى تاريخ: ${endDate}`);

      // جلب طلبات الزبائن الذين تم إحالتهم من هذا العضو
      // تعديل endDate ليكون نهاية اليوم (23:59:59.999) بدلاً من بدايته (00:00:00)
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      const customerOrders = await Order.find({
        referredBy: member._id,
        isDelivered: true,
        deliveredAt: {
          $gte: new Date(startDate),
          $lte: endDateObj
        },
        // استثناء الطلبيات التي تم احتساب عمولتها بالفعل
        isCustomerCommissionCalculated: { $ne: true }
      }).populate('user', 'role').populate('orderItems.product');

      console.log(`   📦 عدد الطلبات المُستَرجَعة: ${customerOrders.length}`);

      // Debug: طباعة عدد الطلبات
      if (customerOrders.length > 0) {
        console.log(`📦 العضو ${member.name} لديه ${customerOrders.length} طلب من زبائن في الفترة`);
      }

      // حساب فرق السعر لكل طلب
      for (const order of customerOrders) {
        // التحقق من أن المشتري زبون وليس عضو
        if (order.user && order.user.role === 'customer') {
          console.log(`   📋 طلب من زبون ${order.user.name || 'غير محدد'} - عدد المنتجات: ${order.orderItems.length}`);
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

            // فرق السعر = (سعر الزبون وقت الشراء - سعر العضو وقت الشراء) × الكمية
            const priceDifference = (actualCustomerPrice - actualSubscriberPrice) * item.quantity;
            const productName = item.name || item.product?.name || 'منتج';
            console.log(`      💵 ${productName}: فرق السعر = (${actualCustomerPrice} - ${actualSubscriberPrice}) × ${item.quantity} = ${priceDifference.toFixed(2)} شيكل`);
            customerPurchaseCommission += priceDifference;
          }
        }
      }

      // Debug: طباعة إجمالي عمولة الزبون للعضو
      if (customerPurchaseCommission > 0) {
        console.log(`   ✅ إجمالي عمولة شراء الزبون للعضو ${member.name}: ${customerPurchaseCommission.toFixed(2)} شيكل`);
      }

      // تحديث الطلبيات لتهميشها (تم احتساب عمولتها)
      if (customerOrders.length > 0) {
        const orderIds = customerOrders.map(order => order._id);
        await Order.updateMany(
          { _id: { $in: orderIds } },
          { $set: { isCustomerCommissionCalculated: true } }
        );
        console.log(`   ✅ تم تهميش ${customerOrders.length} طلبية`);
      }

      // إجمالي الأرباح للعضو قبل الخصم (أرباح الأداء + القيادة + عمولة شراء الزبون)
      const memberTotalProfit = performanceProfitInShekel + leadershipCommission.commissionInShekel + customerPurchaseCommission;

      // حساب عمولة تطوير الموقع (3% من الإجمالي، فقط إذا كان الربح > 100 شيكل)
      const websiteDevelopmentCommission = memberTotalProfit > 100 ? memberTotalProfit * 0.03 : 0;

      // الناتج النهائي: نخصم العمولة ثم نقرب للأسفل
      const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

      // Debug: طباعة القيم للتحقق
      console.log(`💰 ${member.name}: أداء=${performanceProfitInShekel}, قيادة=${leadershipCommission.commissionInShekel}, عمولة زبون=${customerPurchaseCommission.toFixed(2)}, قبل الخصم=${memberTotalProfit.toFixed(2)}, خصم موقع 3%=${websiteDevelopmentCommission.toFixed(2)}, النهائي=${finalProfit}`);

      membersProfits.push({
        memberId: member._id,
        memberName: member.name,
        username: member.username,
        memberRank: memberRankNumber,
        rankName: rankInfo.name,
        rankNameEn: rankInfo.nameEn,
        points: {
          personal: personalPoints,
          generation1: networkCommissions.team.generation1,
          generation2: networkCommissions.team.generation2,
          generation3: networkCommissions.team.generation3,
          generation4: networkCommissions.team.generation4,
          generation5: networkCommissions.team.generation5,
          total: personalPoints + teamCommissionPoints
        },
        commissions: {
          performance: {
            personal: personalProfitInShekel,
            team: teamProfitInShekel,
            totalPoints: totalCommissionPoints,
            totalInShekel: performanceProfitInShekel
          },
          leadership: {
            totalCommissionPoints: leadershipCommission.totalCommissionPoints || 0,
            commissionInShekel: leadershipCommission.commissionInShekel || 0,
            hasLeadershipCommission: leadershipCommission.hasLeadershipCommission || false
          }
        },
        profit: {
          personalProfit: personalProfitInShekel,
          teamProfit: teamProfitInShekel,
          performanceProfit: performanceProfitInShekel,
          leadershipProfit: leadershipCommission.commissionInShekel || 0,
          customerPurchaseCommission: customerPurchaseCommission,
          totalProfitBeforeDeduction: memberTotalProfit,
          websiteDevelopmentCommission: websiteDevelopmentCommission,
          totalProfit: finalProfit,
          conversionRate: 0.55
        }
      });

      totalPerformanceProfits += performanceProfitInShekel;
      totalLeadershipProfits += (leadershipCommission.commissionInShekel || 0);
      totalProfits += finalProfit;
    }

    // حساب المتوسط
    const averageProfit = members.length > 0 ? totalProfits / members.length : 0;

    // إنشاء سجل فترة الأرباح
    const profitPeriod = new ProfitPeriod({
      periodName,
      periodNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      calculatedBy: req.user._id,
      calculatedByName: req.user.name,
      membersProfits,
      summary: {
        totalMembers: members.length,
        totalPerformanceProfits,
        totalLeadershipProfits,
        totalProfits,
        averageProfit
      },
      notes: notes || '',
      status: 'draft'
    });

    await profitPeriod.save();

    // لا يتم تصفير النقاط الآن - يحدث فقط عند إغلاق الدورة
    console.log(`✅ تم احتساب الأرباح للدورة ${periodName} وحفظها بحالة مسودة (في انتظار إغلاق الأدمن)`);

    res.status(201).json({
      success: true,
      message: `تم احتساب الأرباح للدورة ${periodName} بنجاح. يمكنك مراجعتها والضغط على "إغلاق" لتأكيدها وتصفير نقاط الأعضاء.`,
      data: {
        periodId: profitPeriod._id,
        periodName: profitPeriod.periodName,
        periodNumber: profitPeriod.periodNumber,
        summary: profitPeriod.summary,
        calculatedAt: profitPeriod.calculatedAt
      }
    });
  } catch (error) {
    console.error('Error calculating period profits:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * الحصول على جميع فترات الأرباح
 */
exports.getAllProfitPeriods = async (req, res) => {
  try {
    const periods = await ProfitPeriod.find()
      .select('periodName periodNumber startDate endDate summary status calculatedAt calculatedByName')
      .sort({ periodNumber: -1 });

    res.status(200).json({
      success: true,
      data: periods
    });
  } catch (error) {
    console.error('Error getting profit periods:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * الحصول على تفاصيل فترة أرباح معينة
 */
exports.getProfitPeriodById = async (req, res) => {
  try {
    const period = await ProfitPeriod.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'فترة الأرباح غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error('Error getting profit period:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * الحصول على أرباح عضو معين في فترة معينة
 */
exports.getMemberProfitInPeriod = async (req, res) => {
  try {
    const { periodId, memberId } = req.params;

    const period = await ProfitPeriod.findById(periodId);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'فترة الأرباح غير موجودة'
      });
    }

    const memberProfit = period.membersProfits.find(
      mp => mp.memberId.toString() === memberId
    );

    if (!memberProfit) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على أرباح لهذا العضو في هذه الفترة'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          periodName: period.periodName,
          periodNumber: period.periodNumber,
          startDate: period.startDate,
          endDate: period.endDate
        },
        memberProfit
      }
    });
  } catch (error) {
    console.error('Error getting member profit:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * حذف فترة أرباح
 */
exports.deleteProfitPeriod = async (req, res) => {
  try {
    const period = await ProfitPeriod.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'فترة الأرباح غير موجودة'
      });
    }

    // منع حذف الفترات المدفوعة
    if (period.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف فترة أرباح مدفوعة'
      });
    }

    // إعادة تأشير الطلبيات عند حذف أي فترة غير مغلقة (draft أو finalized)
    const endDateObj = new Date(period.endDate);
    endDateObj.setHours(23, 59, 59, 999);
    await Order.updateMany(
      {
        isDelivered: true,
        deliveredAt: { $gte: new Date(period.startDate), $lte: endDateObj },
        isCustomerCommissionCalculated: true
      },
      { $set: { isCustomerCommissionCalculated: false } }
    );
    console.log(`✅ تم إعادة تأشير الطلبيات ضمن فترة ${period.periodName} لإمكانية إعادة الاحتساب`);

    await ProfitPeriod.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف فترة الأرباح بنجاح'
    });
  } catch (error) {
    console.error('Error deleting profit period:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * تحديث حالة فترة الأرباح
 */
exports.updateProfitPeriodStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'finalized', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة'
      });
    }

    const period = await ProfitPeriod.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'فترة الأرباح غير موجودة'
      });
    }

    // عند إغلاق الدورة: طرح النقاط المحتسبة في هذه الدورة فقط (وليس تصفير الكل)
    // هذا يحافظ على النقاط الجديدة التي أُضيفت بعد احتساب الدورة
    if (status === 'paid' && period.status !== 'paid') {
      const bulkOps = period.membersProfits.map(mp => ({
        updateOne: {
          filter: { _id: mp.memberId },
          update: [{
            $set: {
              monthlyPoints:    { $max: [0, { $subtract: ['$monthlyPoints',    mp.points.personal    || 0] }] },
              generation1Points:{ $max: [0, { $subtract: ['$generation1Points', mp.points.generation1 || 0] }] },
              generation2Points:{ $max: [0, { $subtract: ['$generation2Points', mp.points.generation2 || 0] }] },
              generation3Points:{ $max: [0, { $subtract: ['$generation3Points', mp.points.generation3 || 0] }] },
              generation4Points:{ $max: [0, { $subtract: ['$generation4Points', mp.points.generation4 || 0] }] },
              generation5Points:{ $max: [0, { $subtract: ['$generation5Points', mp.points.generation5 || 0] }] },
              profitPoints:     { $max: [0, { $subtract: ['$profitPoints',      mp.points.profitPoints || 0] }] }
            }
          }]
        }
      }));

      await User.bulkWrite(bulkOps);

      console.log(`✅ تم طرح نقاط ${period.membersProfits.length} عضو عند إغلاق الدورة ${period.periodName}`);
    }

    period.status = status;
    await period.save();

    res.status(200).json({
      success: true,
      message: status === 'paid'
        ? 'تم إغلاق فترة الأرباح بنجاح وتصفير نقاط الأعضاء'
        : 'تم تحديث حالة فترة الأرباح بنجاح',
      data: period
    });
  } catch (error) {
    console.error('Error updating profit period status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * الحصول على جميع دورات الأرباح الخاصة بالعضو الحالي
 */
exports.getMyProfitPeriods = async (req, res) => {
  try {
    const memberId = req.user._id;

    // الحصول على فترات الأرباح المغلقة فقط التي تحتوي على بيانات هذا العضو
    const periods = await ProfitPeriod.find({
      'membersProfits.memberId': memberId,
      status: 'paid'
    })
      .select('periodName periodNumber startDate endDate status calculatedAt membersProfits')
      .sort({ periodNumber: -1 });

    // استخراج أرباح العضو من كل فترة
    const memberProfits = periods.map(period => {
      const memberProfit = period.membersProfits.find(
        mp => mp.memberId.toString() === memberId.toString()
      );

      return {
        periodId: period._id,
        periodName: period.periodName,
        periodNumber: period.periodNumber,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        calculatedAt: period.calculatedAt,
        profit: memberProfit ? {
          personalProfit: memberProfit.profit.personalProfit,
          teamProfit: memberProfit.profit.teamProfit,
          performanceProfit: memberProfit.profit.performanceProfit,
          leadershipProfit: memberProfit.profit.leadershipProfit,
          customerPurchaseCommission: memberProfit.profit.customerPurchaseCommission || 0,
          totalProfitBeforeDeduction: memberProfit.profit.totalProfitBeforeDeduction || 0,
          websiteDevelopmentCommission: memberProfit.profit.websiteDevelopmentCommission || 0,
          totalProfit: memberProfit.profit.totalProfit,
          points: memberProfit.points,
          rankName: memberProfit.rankName
        } : null
      };
    });

    // حساب إجمالي الأرباح من جميع الدورات
    const totalProfitsAllPeriods = memberProfits.reduce((sum, p) => {
      return sum + (p.profit ? p.profit.totalProfit : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        periods: memberProfits,
        summary: {
          totalPeriods: memberProfits.length,
          totalProfitsAllPeriods: totalProfitsAllPeriods
        }
      }
    });
  } catch (error) {
    console.error('Error getting member profit periods:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
