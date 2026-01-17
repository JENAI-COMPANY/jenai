const User = require('../models/User');
const Order = require('../models/Order');

// Get dashboard statistics for current user
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize stats object
    const stats = {
      totalTeamMembers: 0,
      newMembersThisMonth: 0,
      teamPointsThisMonth: 0,
      monthlyCommission: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      stoppedMembers: 0,
      leaders: [],
      teamMembers: []
    };

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Build query based on user role
    let teamQuery = {};

    if (user.role === 'super_admin') {
      // Super admin sees all subscribers and regional admins
      teamQuery = {
        role: { $in: ['subscriber', 'regional_admin'] }
      };
    } else if (user.role === 'regional_admin') {
      // Regional admin sees subscribers in their downline
      teamQuery = {
        role: 'subscriber',
        sponsorId: userId
      };

      // Also get all downstream members
      const downlineMembers = await getAllDownlineMembers(userId);
      if (downlineMembers.length > 0) {
        teamQuery = {
          _id: { $in: downlineMembers }
        };
      }
    } else if (user.role === 'subscriber') {
      // Subscriber sees their direct downline and downstream
      const downlineMembers = await getAllDownlineMembers(userId);
      if (downlineMembers.length > 0) {
        teamQuery = {
          _id: { $in: downlineMembers }
        };
      }
    } else {
      // Regular customers don't have a team
      return res.json(stats);
    }

    // Get all team members
    const teamMembers = await User.find(teamQuery)
      .select('name username subscriberId subscriberCode role points createdAt sponsorId')
      .sort({ createdAt: -1 });

    stats.totalTeamMembers = teamMembers.length;
    stats.teamMembers = teamMembers.map(member => ({
      _id: member._id,
      name: member.name,
      subscriberCode: member.subscriberCode,
      role: member.role,
      points: member.points || 0,
      createdAt: member.createdAt,
      activityStatus: determineActivityStatus(member)
    }));

    // Count new members this month
    stats.newMembersThisMonth = teamMembers.filter(member =>
      new Date(member.createdAt) >= monthStart && new Date(member.createdAt) <= monthEnd
    ).length;

    // Calculate team points for this month (from orders)
    const teamMemberIds = teamMembers.map(m => m._id);
    const monthlyOrders = await Order.find({
      user: { $in: teamMemberIds },
      createdAt: { $gte: monthStart, $lte: monthEnd },
      status: { $in: ['processing', 'shipped', 'delivered'] }
    });

    stats.teamPointsThisMonth = monthlyOrders.reduce((total, order) => {
      return total + (order.pointsEarned || 0);
    }, 0);

    // Calculate monthly commission
    stats.monthlyCommission = monthlyOrders.reduce((total, order) => {
      return total + (order.commissionEarned || 0);
    }, 0);

    // Activity Status Counts
    stats.teamMembers.forEach(member => {
      if (member.activityStatus === 'active') {
        stats.activeMembers++;
      } else if (member.activityStatus === 'inactive') {
        stats.inactiveMembers++;
      } else {
        stats.stoppedMembers++;
      }
    });

    // Get top leaders (subscribers with most team members and points)
    const leadersData = await Promise.all(
      teamMembers
        .filter(m => m.role === 'subscriber')
        .map(async (member) => {
          const memberDownline = await getAllDownlineMembers(member._id);
          const memberOrders = await Order.find({
            user: member._id,
            status: { $in: ['processing', 'shipped', 'delivered'] }
          });

          const totalPoints = memberOrders.reduce((sum, order) => sum + (order.pointsEarned || 0), 0);

          return {
            _id: member._id,
            name: member.name,
            subscriberCode: member.subscriberCode,
            teamSize: memberDownline.length,
            totalPoints
          };
        })
    );

    // Sort leaders by team size and points
    stats.leaders = leadersData
      .sort((a, b) => {
        if (b.teamSize !== a.teamSize) {
          return b.teamSize - a.teamSize;
        }
        return b.totalPoints - a.totalPoints;
      })
      .slice(0, 10); // Top 10 leaders

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Helper function to get all downstream members recursively
async function getAllDownlineMembers(userId) {
  const directDownline = await User.find({ sponsorId: userId }).select('_id');
  let allMembers = directDownline.map(m => m._id);

  for (const member of directDownline) {
    const nestedDownline = await getAllDownlineMembers(member._id);
    allMembers = allMembers.concat(nestedDownline);
  }

  return allMembers;
}

// Helper function to determine activity status
function determineActivityStatus(member) {
  const now = new Date();
  const lastActive = member.lastActivityDate || member.createdAt;
  const daysSinceActive = Math.floor((now - new Date(lastActive)) / (1000 * 60 * 60 * 24));

  if (daysSinceActive <= 30) {
    return 'active';
  } else if (daysSinceActive <= 90) {
    return 'inactive';
  } else {
    return 'stopped';
  }
}
