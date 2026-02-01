const ActiveUser = require('../models/ActiveUser');

// Track user activity (heartbeat)
exports.trackActivity = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Update or create active user session
    await ActiveUser.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        userId: req.user?._id || null,
        lastActivity: new Date(),
        ipAddress,
        userAgent
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get count of active users (super admin only)
exports.getActiveUsersCount = async (req, res) => {
  try {
    // Count sessions active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await ActiveUser.countDocuments({
      lastActivity: { $gte: fiveMinutesAgo }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get detailed active users info (super admin only)
exports.getActiveUsers = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await ActiveUser.find({
      lastActivity: { $gte: fiveMinutesAgo }
    })
      .populate('userId', 'name username role')
      .sort({ lastActivity: -1 });

    res.json({ activeUsers, count: activeUsers.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
