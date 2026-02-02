const User = require('../models/User');
const Order = require('../models/Order');

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

      // Find all users who were referred by this sponsor
      const members = await User.find({
        sponsorCode: sponsorCode,
        role: { $in: ['member', 'subscriber', 'customer'] }
      })
        .select('name username subscriberCode points monthlyPoints createdAt country city memberRank isActive')
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
      totalPoints: teamMembers.reduce((sum, member) => sum + (member.monthlyPoints || 0), 0),
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

// Get direct referrals only (Level 1)
exports.getDirectReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const directReferrals = await User.find({
      sponsorCode: user.subscriberCode,
      role: { $in: ['member', 'subscriber', 'customer'] }
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
