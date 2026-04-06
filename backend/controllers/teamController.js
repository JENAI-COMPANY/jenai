const User = require('../models/User');
const Order = require('../models/Order');
const PointTransaction = require('../models/PointTransaction');
const ProfitPeriod = require('../models/ProfitPeriod');

// Get team members (5 levels deep) with their points
exports.getMyTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Function to get team members recursively
    const getTeamMembers = async (sponsorCode, level, maxLevel = 5) => {
      if (level > maxLevel) return [];

      // Find all users who were referred by this sponsor (members only, exclude customers)
      const members = await User.find({
        sponsorCode: sponsorCode,
        role: { $in: ['member', 'subscriber'] }
      })
        .select('name username subscriberCode points monthlyPoints bonusPoints firstOrderBonus createdAt country city memberRank isActive phone')
        .lean();

      let allMembers = [];

      for (const member of members) {
        // Add current member with level info
        const memberData = {
          ...member,
          level: level,
          directSponsor: sponsorCode
        };
        allMembers.push(memberData);

        // Recursively get their referrals
        if (member.subscriberCode && level < maxLevel) {
          const subMembers = await getTeamMembers(member.subscriberCode, level + 1, maxLevel);
          allMembers = allMembers.concat(subMembers);
        }
      }

      return allMembers;
    };

    // Get all team members starting from level 1
    const teamMembers = await getTeamMembers(user.subscriberCode, 1);

    // Calculate start of last month
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check which members have ordered in the last month
    const memberIds = teamMembers.map(m => m._id);
    const recentOrders = await Order.aggregate([
      {
        $match: {
          user: { $in: memberIds },
          createdAt: { $gte: oneMonthAgo }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map of user IDs who have ordered recently
    const activeUserIds = new Set(recentOrders.map(order => order._id.toString()));

    // Add isActiveLastMonth to each member
    teamMembers.forEach(member => {
      member.isActiveLastMonth = activeUserIds.has(member._id.toString());
    });

    // Calculate statistics
    const stats = {
      totalMembers: teamMembers.length,
      totalPoints: teamMembers.reduce((sum, member) => sum + Math.max(0, (member.monthlyPoints || 0) - (member.bonusPoints || 0)), 0),
      levelCounts: {
        level1: teamMembers.filter(m => m.level === 1).length,
        level2: teamMembers.filter(m => m.level === 2).length,
        level3: teamMembers.filter(m => m.level === 3).length,
        level4: teamMembers.filter(m => m.level === 4).length,
        level5: teamMembers.filter(m => m.level === 5).length
      },
      newMembersThisMonth: {
        level1: teamMembers.filter(m => m.level === 1 && new Date(m.createdAt) >= startOfMonth).length,
        level2: teamMembers.filter(m => m.level === 2 && new Date(m.createdAt) >= startOfMonth).length,
        level3: teamMembers.filter(m => m.level === 3 && new Date(m.createdAt) >= startOfMonth).length,
        level4: teamMembers.filter(m => m.level === 4 && new Date(m.createdAt) >= startOfMonth).length,
        level5: teamMembers.filter(m => m.level === 5 && new Date(m.createdAt) >= startOfMonth).length
      }
    };

    res.json({
      success: true,
      userCode: user.subscriberCode,
      stats,
      team: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific member's team by their subscriberCode
exports.getMemberTeam = async (req, res) => {
  try {
    const { subscriberCode } = req.params;

    const getTeamMembers = async (sponsorCode, level, maxLevel = 5) => {
      if (level > maxLevel) return [];
      const members = await User.find({
        sponsorCode,
        role: { $in: ['member', 'subscriber'] }
      })
        .select('name username subscriberCode points monthlyPoints bonusPoints firstOrderBonus createdAt country city memberRank isActive phone')
        .lean();

      let allMembers = [];
      for (const member of members) {
        allMembers.push({ ...member, level, directSponsor: sponsorCode });
        if (member.subscriberCode && level < maxLevel) {
          const subMembers = await getTeamMembers(member.subscriberCode, level + 1, maxLevel);
          allMembers = allMembers.concat(subMembers);
        }
      }
      return allMembers;
    };

    const teamMembers = await getTeamMembers(subscriberCode, 1);

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (teamMembers.length > 0) {
      const memberIds = teamMembers.map(m => m._id);
      const recentOrders = await Order.aggregate([
        { $match: { user: { $in: memberIds }, createdAt: { $gte: oneMonthAgo } } },
        { $group: { _id: '$user', orderCount: { $sum: 1 } } }
      ]);
      const activeUserIds = new Set(recentOrders.map(o => o._id.toString()));
      teamMembers.forEach(m => { m.isActiveLastMonth = activeUserIds.has(m._id.toString()); });
    }

    const stats = {
      totalMembers: teamMembers.length,
      totalPoints: teamMembers.reduce((sum, m) => sum + (m.monthlyPoints || 0), 0),
      levelCounts: {
        level1: teamMembers.filter(m => m.level === 1).length,
        level2: teamMembers.filter(m => m.level === 2).length,
        level3: teamMembers.filter(m => m.level === 3).length,
        level4: teamMembers.filter(m => m.level === 4).length,
        level5: teamMembers.filter(m => m.level === 5).length,
      },
      newMembersThisMonth: {
        level1: teamMembers.filter(m => m.level === 1 && new Date(m.createdAt) >= startOfMonth).length,
        level2: teamMembers.filter(m => m.level === 2 && new Date(m.createdAt) >= startOfMonth).length,
        level3: teamMembers.filter(m => m.level === 3 && new Date(m.createdAt) >= startOfMonth).length,
        level4: teamMembers.filter(m => m.level === 4 && new Date(m.createdAt) >= startOfMonth).length,
        level5: teamMembers.filter(m => m.level === 5 && new Date(m.createdAt) >= startOfMonth).length,
      }
    };

    res.json({ success: true, userCode: subscriberCode, stats, team: teamMembers });
  } catch (error) {
    console.error('Error fetching member team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get direct referrals only (Level 1)
exports.getDirectReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find direct referrals (members only, exclude customers)
    const directReferrals = await User.find({
      sponsorCode: user.subscriberCode,
      role: { $in: ['member', 'subscriber'] }
    })
      .select('name username subscriberCode points monthlyPoints createdAt country city memberRank isActive')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate if members have ordered in last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const memberIds = directReferrals.map(m => m._id);
    const recentOrders = await Order.aggregate([
      {
        $match: {
          user: { $in: memberIds },
          createdAt: { $gte: oneMonthAgo }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const activeUserIds = new Set(recentOrders.map(order => order._id.toString()));

    // Add isActiveLastMonth to each referral
    directReferrals.forEach(member => {
      member.isActiveLastMonth = activeUserIds.has(member._id.toString());
    });

    res.json({
      success: true,
      userCode: user.subscriberCode,
      count: directReferrals.length,
      referrals: directReferrals
    });
  } catch (error) {
    console.error('Error fetching direct referrals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get team bonus points for current period (admin_bonus + first_order_bonus not yet in profit calculation)
exports.getTeamCurrentBonusPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // تاريخ بداية الفترة الحالية = نهاية آخر فترة محسوبة
    const lastPaidPeriod = await ProfitPeriod.findOne({ status: 'paid' }).sort({ endDate: -1 });
    const periodStart = lastPaidPeriod ? new Date(lastPaidPeriod.endDate) : new Date('2000-01-01');

    // جمع كل أعضاء الفريق (5 أجيال)
    const getTeamMembers = async (sponsorCode, level, maxLevel = 5) => {
      if (level > maxLevel || !sponsorCode) return [];
      const members = await User.find({ sponsorCode, role: { $in: ['member', 'subscriber'] } })
        .select('_id subscriberCode').lean();
      let all = [...members];
      for (const m of members) {
        const sub = await getTeamMembers(m.subscriberCode, level + 1, maxLevel);
        all = all.concat(sub);
      }
      return all;
    };

    const teamMembers = await getTeamMembers(user.subscriberCode, 1);
    const teamIds = teamMembers.map(m => m._id);

    if (teamIds.length === 0) return res.json({ bonusPoints: 0 });

    // مجموع PointTransactions من نوع bonus في الفترة الحالية
    const result = await PointTransaction.aggregate([
      {
        $match: {
          memberId: { $in: teamIds },
          type: 'bonus',
          earnedAt: { $gte: periodStart }
        }
      },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const bonusPoints = result.length > 0 ? Math.round(result[0].total) : 0;
    res.json({ bonusPoints, periodStart });
  } catch (error) {
    console.error('Error fetching team bonus points:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
