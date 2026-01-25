const User = require('../models/User');

// ══════════════════════════════════════════════════════════════
// الحصول على معلومات العضو ونقاطه
// ══════════════════════════════════════════════════════════════
exports.getMyPoints = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);

    if (!member || member.role !== 'member') {
      return res.status(403).json({
        message: 'Access denied. Member privileges required.',
        messageAr: 'غير مصرح. صلاحيات العضو مطلوبة.'
      });
    }

    // حساب إجمالي نقاط الأجيال
    const teamPoints = (member.generation1Points || 0) +
      (member.generation2Points || 0) +
      (member.generation3Points || 0) +
      (member.generation4Points || 0) +
      (member.generation5Points || 0);

    // حساب النقاط التراكمية
    const cumulativePoints = (member.points || 0) + teamPoints;

    // تحويل النقاط إلى أرباح (للعرض فقط - القيم الفعلية محفوظة في totalCommission)
    const POINTS_TO_CURRENCY = 0.55;
    // نقاط الربح (من المسابقات) تُحسب كأرباح مباشرة
    const profitPointsProfit = (member.profitPoints || 0) * POINTS_TO_CURRENCY;
    const personalProfit = ((member.points || 0) * 0.20 * POINTS_TO_CURRENCY) + profitPointsProfit;
    const teamProfit = teamPoints * POINTS_TO_CURRENCY;
    const leadershipProfit = (member.leadershipPoints || 0) * POINTS_TO_CURRENCY;

    res.json({
      success: true,
      data: {
        // معلومات العضو
        name: member.name,
        username: member.username,
        memberCode: member.subscriberCode,
        memberRank: member.memberRank,

        // النقاط الشخصية
        personalPoints: Math.floor(member.points || 0),
        personalProfit: Math.floor(personalProfit),

        // نقاط الفريق (الأجيال الخمسة)
        teamPoints: {
          generation1: Math.floor(member.generation1Points || 0),
          generation2: Math.floor(member.generation2Points || 0),
          generation3: Math.floor(member.generation3Points || 0),
          generation4: Math.floor(member.generation4Points || 0),
          generation5: Math.floor(member.generation5Points || 0),
          total: Math.floor(teamPoints)
        },
        teamProfit: Math.floor(teamProfit),

        // نقاط القيادة
        leadershipPoints: Math.floor(member.leadershipPoints || 0),
        leadershipProfit: Math.floor(leadershipProfit),

        // الإجماليات (هذه القيم محفوظة بالفعل مع Math.floor في قاعدة البيانات)
        totalPoints: Math.floor(cumulativePoints),
        totalProfit: Math.floor(member.totalCommission || 0),
        availableCommission: Math.floor(member.availableCommission || 0),
        withdrawnCommission: Math.floor(member.withdrawnCommission || 0),

        // نقاط شهرية
        monthlyPoints: Math.floor(member.monthlyPoints || 0),

        // نقاط الربح (للمسابقات والجوائز)
        profitPoints: Math.floor(member.profitPoints || 0),
        profitPointsProfit: Math.floor(profitPointsProfit)
      }
    });
  } catch (error) {
    console.error('Error getting member points:', error);
    res.status(500).json({
      message: 'Error fetching member points',
      messageAr: 'خطأ في جلب نقاط العضو'
    });
  }
};

// ══════════════════════════════════════════════════════════════
// الحصول على شجرة الفريق (5 مستويات)
// ══════════════════════════════════════════════════════════════
exports.getMyTeam = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);

    if (!member || member.role !== 'member') {
      return res.status(403).json({
        message: 'Access denied. Member privileges required.',
        messageAr: 'غير مصرح. صلاحيات العضو مطلوبة.'
      });
    }

    // دالة لجلب أعضاء مستوى معين
    const getGeneration = async (parentIds, level) => {
      if (level > 5 || !parentIds || parentIds.length === 0) {
        return [];
      }

      const members = await User.find({
        referredBy: { $in: parentIds },
        role: 'member'
      }).select('_id name username subscriberCode memberRank points monthlyPoints createdAt');

      return members.map(m => ({
        id: m._id,
        name: m.name,
        username: m.username,
        memberCode: m.subscriberCode,
        rank: m.memberRank,
        points: Math.floor(m.points || 0),
        monthlyPoints: Math.floor(m.monthlyPoints || 0),
        joinedAt: m.createdAt,
        level: level
      }));
    };

    // جلب الأجيال الخمسة
    const generation1 = await getGeneration([member._id], 1);
    const generation2 = await getGeneration(generation1.map(m => m.id), 2);
    const generation3 = await getGeneration(generation2.map(m => m.id), 3);
    const generation4 = await getGeneration(generation3.map(m => m.id), 4);
    const generation5 = await getGeneration(generation4.map(m => m.id), 5);

    // إحصائيات لكل جيل
    const statistics = {
      generation1: {
        count: generation1.length,
        totalPoints: generation1.reduce((sum, m) => sum + m.points, 0)
      },
      generation2: {
        count: generation2.length,
        totalPoints: generation2.reduce((sum, m) => sum + m.points, 0)
      },
      generation3: {
        count: generation3.length,
        totalPoints: generation3.reduce((sum, m) => sum + m.points, 0)
      },
      generation4: {
        count: generation4.length,
        totalPoints: generation4.reduce((sum, m) => sum + m.points, 0)
      },
      generation5: {
        count: generation5.length,
        totalPoints: generation5.reduce((sum, m) => sum + m.points, 0)
      },
      total: {
        count: generation1.length + generation2.length + generation3.length + generation4.length + generation5.length,
        totalPoints: generation1.reduce((sum, m) => sum + m.points, 0) +
          generation2.reduce((sum, m) => sum + m.points, 0) +
          generation3.reduce((sum, m) => sum + m.points, 0) +
          generation4.reduce((sum, m) => sum + m.points, 0) +
          generation5.reduce((sum, m) => sum + m.points, 0)
      }
    };

    res.json({
      success: true,
      data: {
        team: {
          generation1,
          generation2,
          generation3,
          generation4,
          generation5
        },
        statistics
      }
    });
  } catch (error) {
    console.error('Error getting member team:', error);
    res.status(500).json({
      message: 'Error fetching team data',
      messageAr: 'خطأ في جلب بيانات الفريق'
    });
  }
};

// ══════════════════════════════════════════════════════════════
// الحصول على شجرة الفريق بشكل هرمي (Tree Structure)
// ══════════════════════════════════════════════════════════════
exports.getMyTeamTree = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);

    if (!member || member.role !== 'member') {
      return res.status(403).json({
        message: 'Access denied. Member privileges required.',
        messageAr: 'غير مصرح. صلاحيات العضو مطلوبة.'
      });
    }

    // دالة لبناء الشجرة بشكل تكراري
    const buildTree = async (parentId, currentLevel, maxLevel) => {
      if (currentLevel > maxLevel) {
        return [];
      }

      const children = await User.find({
        referredBy: parentId,
        role: 'member'
      }).select('_id name username subscriberCode memberRank points monthlyPoints createdAt');

      const childrenData = [];
      for (const child of children) {
        const childNode = {
          id: child._id,
          name: child.name,
          username: child.username,
          memberCode: child.subscriberCode,
          rank: child.memberRank,
          points: Math.floor(child.points || 0),
          monthlyPoints: Math.floor(child.monthlyPoints || 0),
          level: currentLevel,
          children: await buildTree(child._id, currentLevel + 1, maxLevel)
        };
        childrenData.push(childNode);
      }

      return childrenData;
    };

    // بناء الشجرة للمستويات الخمسة
    const tree = await buildTree(member._id, 1, 5);

    res.json({
      success: true,
      data: {
        root: {
          id: member._id,
          name: member.name,
          username: member.username,
          memberCode: member.subscriberCode,
          rank: member.memberRank,
          points: Math.floor(member.points || 0),
          level: 0
        },
        tree
      }
    });
  } catch (error) {
    console.error('Error getting team tree:', error);
    res.status(500).json({
      message: 'Error fetching team tree',
      messageAr: 'خطأ في جلب شجرة الفريق'
    });
  }
};

module.exports = exports;
