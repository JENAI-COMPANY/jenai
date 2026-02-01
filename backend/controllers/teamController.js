const User = require('../models/User');

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
        .select('name username subscriberCode points monthlyPoints createdAt country city')
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

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
      .select('name username subscriberCode points monthlyPoints createdAt country city')
      .sort({ createdAt: -1 })
      .lean();

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
