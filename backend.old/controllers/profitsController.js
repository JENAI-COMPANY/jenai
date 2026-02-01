const User = require('../models/User');
const { calculateTotalPoints, GENERATION_COMMISSION_RATES, POINTS_TO_SHEKEL_RATE } = require('../utils/pointsCalculator');
const { calculateLeadershipCommission, getRankInfo } = require('../config/memberRanks');

/**
 * حساب الأرباح التفصيلية للعضو
 */
exports.calculateMemberProfits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== 'member') {
      return res.status(403).json({ message: 'هذه الخدمة متاحة للأعضاء فقط' });
    }

    // جمع بيانات النقاط
    const memberData = {
      personalPoints: user.monthlyPoints || 0,
      generationsPoints: [
        user.generation1Points || 0,
        user.generation2Points || 0,
        user.generation3Points || 0,
        user.generation4Points || 0,
        user.generation5Points || 0
      ]
    };

    // حساب أرباح الأداء (الأرباح الأساسية)
    const profitDetails = calculateTotalPoints(memberData);

    // حساب عمولة القيادة (للأعضاء من برونزي وما فوق)
    const leadershipCommission = await calculateLeadershipCommission(User, user._id);
    const rankInfo = getRankInfo(user.memberRank);

    // إجمالي الأرباح = أرباح الأداء + عمولة القيادة
    const totalProfitInShekel = profitDetails.profitInShekel + leadershipCommission.commissionInShekel;

    res.status(200).json({
      success: true,
      data: {
        member: {
          name: user.name,
          username: user.username,
          memberRank: user.memberRank,
          rankName: rankInfo.name,
          rankNameEn: rankInfo.nameEn
        },
        points: {
          personal: profitDetails.personalPoints,
          generation1: profitDetails.generationsPoints[0],
          generation2: profitDetails.generationsPoints[1],
          generation3: profitDetails.generationsPoints[2],
          generation4: profitDetails.generationsPoints[3],
          generation5: profitDetails.generationsPoints[4],
          total: profitDetails.personalPoints + profitDetails.generationsPoints.reduce((sum, p) => sum + p, 0)
        },
        commissions: {
          performance: {
            personal: {
              points: profitDetails.personalCommissionPoints,
              percentage: GENERATION_COMMISSION_RATES.personal * 100
            },
            generation1: {
              points: profitDetails.generationsCommissionPoints[0],
              percentage: GENERATION_COMMISSION_RATES.generation1 * 100
            },
            generation2: {
              points: profitDetails.generationsCommissionPoints[1],
              percentage: GENERATION_COMMISSION_RATES.generation2 * 100
            },
            generation3: {
              points: profitDetails.generationsCommissionPoints[2],
              percentage: GENERATION_COMMISSION_RATES.generation3 * 100
            },
            generation4: {
              points: profitDetails.generationsCommissionPoints[3],
              percentage: GENERATION_COMMISSION_RATES.generation4 * 100
            },
            generation5: {
              points: profitDetails.generationsCommissionPoints[4],
              percentage: GENERATION_COMMISSION_RATES.generation5 * 100
            },
            totalPoints: profitDetails.totalCommissionPoints,
            totalInShekel: profitDetails.profitInShekel
          },
          leadership: leadershipCommission
        },
        profit: {
          performanceProfit: profitDetails.profitInShekel,
          leadershipProfit: leadershipCommission.commissionInShekel,
          totalProfit: totalProfitInShekel,
          conversionRate: POINTS_TO_SHEKEL_RATE,
          formattedAmount: `${totalProfitInShekel.toFixed(2)} ₪`
        },
        breakdown: profitDetails.breakdown
      }
    });
  } catch (error) {
    console.error('Error calculating profits:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * الحصول على ملخص الأرباح لجميع الأعضاء (للمدير)
 */
exports.getAllMembersProfits = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' })
      .select('name username memberRank monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points')
      .sort({ monthlyPoints: -1 });

    const membersWithProfits = members.map(member => {
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

      const profitDetails = calculateTotalPoints(memberData);

      return {
        _id: member._id,
        name: member.name,
        username: member.username,
        memberRank: member.memberRank,
        personalPoints: memberData.personalPoints,
        generationsTotal: memberData.generationsPoints.reduce((sum, p) => sum + p, 0),
        totalCommissionPoints: profitDetails.totalCommissionPoints,
        profitInShekel: profitDetails.profitInShekel
      };
    });

    const totalProfits = membersWithProfits.reduce((sum, m) => sum + m.profitInShekel, 0);

    res.status(200).json({
      success: true,
      data: {
        members: membersWithProfits,
        summary: {
          totalMembers: membersWithProfits.length,
          totalProfits: totalProfits,
          averageProfit: membersWithProfits.length > 0 ? totalProfits / membersWithProfits.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting all members profits:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
