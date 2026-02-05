const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { calculateTotalPoints } = require('../utils/pointsCalculator');
const { calculateLeadershipCommission, getRankInfo, getRankNumber } = require('../config/memberRanks');

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
      .select('name username memberRank monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    const membersProfits = [];
    let totalPerformanceProfits = 0;
    let totalLeadershipProfits = 0;
    let totalProfits = 0;

    // حساب أرباح كل عضو
    for (const member of members) {
      // النقاط الشخصية (خام)
      const personalPoints = member.monthlyPoints || 0;

      // نقاط الأجيال (بعد تطبيق النسب - مخزنة في قاعدة البيانات)
      const gen1Points = member.generation1Points || 0;
      const gen2Points = member.generation2Points || 0;
      const gen3Points = member.generation3Points || 0;
      const gen4Points = member.generation4Points || 0;
      const gen5Points = member.generation5Points || 0;

      // حساب أرباح الأداء الشخصي: نقاط × 20% × 0.55
      const personalCommissionPoints = personalPoints * 0.20;
      const personalProfitInShekel = Math.floor(personalCommissionPoints * 0.55);

      // حساب أرباح الفريق: نقاط الأجيال (بعد النسب) × 0.55
      const teamCommissionPoints = gen1Points + gen2Points + gen3Points + gen4Points + gen5Points;
      const teamProfitInShekel = Math.floor(teamCommissionPoints * 0.55);

      // إجمالي أرباح الأداء
      const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;
      const totalCommissionPoints = personalCommissionPoints + teamCommissionPoints;

      // حساب عمولة القيادة
      const leadershipCommission = await calculateLeadershipCommission(User, member._id);
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

      // حساب عمولة تطوير الموقع (5% من الإجمالي) - بدون تقريب
      const websiteDevelopmentCommission = memberTotalProfit * 0.05;

      // الناتج النهائي: نخصم العمولة ثم نقرب للأسفل
      const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

      // Debug: طباعة القيم للتحقق
      console.log(`💰 ${member.name}: أداء=${performanceProfitInShekel}, قيادة=${leadershipCommission.commissionInShekel}, عمولة زبون=${customerPurchaseCommission.toFixed(2)}, قبل الخصم=${memberTotalProfit.toFixed(2)}, عمولة 5%=${websiteDevelopmentCommission.toFixed(2)}, النهائي=${finalProfit}`);

      membersProfits.push({
        memberId: member._id,
        memberName: member.name,
        username: member.username,
        memberRank: memberRankNumber,
        rankName: rankInfo.name,
        rankNameEn: rankInfo.nameEn,
        points: {
          personal: personalPoints,
          generation1: gen1Points,
          generation2: gen2Points,
          generation3: gen3Points,
          generation4: gen4Points,
          generation5: gen5Points,
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
      status: 'finalized'
    });

    await profitPeriod.save();

    // تصفير نقاط الأداء الشخصي ونقاط الأجيال بعد احتساب الأرباح
    for (const member of members) {
      const personalPoints = member.monthlyPoints || 0;
      const gen1Points = member.generation1Points || 0;
      const gen2Points = member.generation2Points || 0;
      const gen3Points = member.generation3Points || 0;
      const gen4Points = member.generation4Points || 0;
      const gen5Points = member.generation5Points || 0;

      // تصفير جميع النقاط المحتسبة (شخصية + أجيال)
      member.monthlyPoints = 0;
      member.generation1Points = 0;
      member.generation2Points = 0;
      member.generation3Points = 0;
      member.generation4Points = 0;
      member.generation5Points = 0;

      await member.save();
    }

    console.log(`✅ تم تصفير نقاط الأداء الشخصي ونقاط الأجيال من ${members.length} عضو`);

    res.status(201).json({
      success: true,
      message: `تم احتساب الأرباح للدورة ${periodName} بنجاح وطرح النقاط المحتسبة`,
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

    const period = await ProfitPeriod.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'فترة الأرباح غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة فترة الأرباح بنجاح',
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

    // الحصول على جميع فترات الأرباح التي تحتوي على بيانات هذا العضو
    const periods = await ProfitPeriod.find({
      'membersProfits.memberId': memberId
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
