const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const { calculateTotalPoints } = require('../utils/pointsCalculator');
const { calculateLeadershipCommission, getRankInfo } = require('../config/memberRanks');

/**
 * احتساب وحفظ أرباح جميع الأعضاء لفترة معينة
 */
exports.calculatePeriodProfits = async (req, res) => {
  try {
    const { periodName, periodNumber, startDate, endDate, notes } = req.body;

    // التحقق من البيانات المطلوبة
    if (!periodName || !periodNumber || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير اسم الدورة، رقم الدورة، تاريخ البداية، وتاريخ النهاية'
      });
    }

    // التحقق من عدم وجود دورة بنفس الرقم
    const existingPeriod = await ProfitPeriod.findOne({ periodNumber });
    if (existingPeriod) {
      return res.status(400).json({
        success: false,
        message: `دورة برقم ${periodNumber} موجودة بالفعل`
      });
    }

    // جلب جميع الأعضاء
    const members = await User.find({ role: 'member' })
      .select('name username memberRank monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    const membersProfits = [];
    let totalPerformanceProfits = 0;
    let totalLeadershipProfits = 0;
    let totalProfits = 0;

    // حساب أرباح كل عضو
    for (const member of members) {
      const memberData = {
        personalPoints: member.monthlyPoints || 0,
        generationsPoints: [
          member.generation1Points || 0,
          member.generation2Points || 0,
          member.generation3Points || 0,
          member.generation4Points || 0,
          member.generation5Points || 0
        ]
      };

      // حساب أرباح الأداء
      const profitDetails = calculateTotalPoints(memberData);

      // حساب عمولة القيادة
      const leadershipCommission = await calculateLeadershipCommission(User, member._id);
      const rankInfo = getRankInfo(member.memberRank);

      // إجمالي الأرباح للعضو
      const memberTotalProfit = profitDetails.profitInShekel + leadershipCommission.commissionInShekel;

      membersProfits.push({
        memberId: member._id,
        memberName: member.name,
        username: member.username,
        memberRank: member.memberRank,
        rankName: rankInfo.name,
        rankNameEn: rankInfo.nameEn,
        points: {
          personal: memberData.personalPoints,
          generation1: memberData.generationsPoints[0],
          generation2: memberData.generationsPoints[1],
          generation3: memberData.generationsPoints[2],
          generation4: memberData.generationsPoints[3],
          generation5: memberData.generationsPoints[4],
          total: memberData.personalPoints + memberData.generationsPoints.reduce((sum, p) => sum + p, 0)
        },
        commissions: {
          performance: {
            totalPoints: profitDetails.totalCommissionPoints,
            totalInShekel: profitDetails.profitInShekel
          },
          leadership: {
            totalCommissionPoints: leadershipCommission.totalCommissionPoints || 0,
            commissionInShekel: leadershipCommission.commissionInShekel || 0,
            hasLeadershipCommission: leadershipCommission.hasLeadershipCommission || false
          }
        },
        profit: {
          performanceProfit: profitDetails.profitInShekel,
          leadershipProfit: leadershipCommission.commissionInShekel || 0,
          totalProfit: memberTotalProfit,
          conversionRate: 0.55
        }
      });

      totalPerformanceProfits += profitDetails.profitInShekel;
      totalLeadershipProfits += (leadershipCommission.commissionInShekel || 0);
      totalProfits += memberTotalProfit;
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

    res.status(201).json({
      success: true,
      message: `تم احتساب الأرباح للدورة ${periodName} بنجاح`,
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

module.exports = exports;
