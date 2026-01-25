const User = require('../models/User');

// @desc    Get member's referral links
// @route   GET /api/referrals/my-links
// @access  Private (Member only)
exports.getMyReferralLinks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('subscriberCode customerReferralLink memberReferralLink customerReferrals memberReferrals referralCount');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // If user is not a member, deny access
    if (user.role !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can access referral links',
        messageAr: 'فقط الأعضاء يمكنهم الوصول لروابط الإحالة'
      });
    }

    // Generate links if they don't exist
    if (!user.customerReferralLink || !user.memberReferralLink) {
      const links = user.generateReferralLinks();
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Referral links generated successfully',
        messageAr: 'تم إنشاء روابط الإحالة بنجاح',
        data: {
          referralCode: user.subscriberCode,
          customerReferralLink: links.customerReferralLink,
          memberReferralLink: links.memberReferralLink,
          statistics: {
            totalReferrals: user.referralCount || 0,
            customerReferrals: user.customerReferrals || 0,
            memberReferrals: user.memberReferrals || 0
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Referral links retrieved successfully',
      messageAr: 'تم استرجاع روابط الإحالة بنجاح',
      data: {
        referralCode: user.subscriberCode,
        customerReferralLink: user.customerReferralLink,
        memberReferralLink: user.memberReferralLink,
        statistics: {
          totalReferrals: user.referralCount || 0,
          customerReferrals: user.customerReferrals || 0,
          memberReferrals: user.memberReferrals || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in getMyReferralLinks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

// @desc    Regenerate member's referral links
// @route   POST /api/referrals/regenerate
// @access  Private (Member only)
exports.regenerateReferralLinks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can regenerate referral links',
        messageAr: 'فقط الأعضاء يمكنهم إعادة إنشاء روابط الإحالة'
      });
    }

    // Generate new links
    const links = user.generateReferralLinks(req.body.baseUrl);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Referral links regenerated successfully',
      messageAr: 'تم إعادة إنشاء روابط الإحالة بنجاح',
      data: {
        referralCode: user.subscriberCode,
        customerReferralLink: links.customerReferralLink,
        memberReferralLink: links.memberReferralLink
      }
    });

  } catch (error) {
    console.error('Error in regenerateReferralLinks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

// @desc    Verify referral code (when user registers)
// @route   GET /api/referrals/verify/:code
// @access  Public
exports.verifyReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    const referrer = await User.findOne({ subscriberCode: code })
      .select('name subscriberCode region');

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        messageAr: 'كود الإحالة غير صحيح'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid referral code',
      messageAr: 'كود إحالة صالح',
      data: {
        referrerName: referrer.name,
        referrerCode: referrer.subscriberCode,
        region: referrer.region
      }
    });

  } catch (error) {
    console.error('Error in verifyReferralCode:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

// @desc    Get referral statistics for member
// @route   GET /api/referrals/statistics
// @access  Private (Member only)
exports.getReferralStatistics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('subscriberCode customerReferrals memberReferrals referralCount downline')
      .populate('downline', 'name subscriberCode createdAt role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    if (user.role !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can view referral statistics',
        messageAr: 'فقط الأعضاء يمكنهم مشاهدة إحصائيات الإحالة'
      });
    }

    // Get recent referrals (last 10)
    const recentReferrals = await User.find({ sponsorId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name subscriberCode role createdAt');

    res.status(200).json({
      success: true,
      message: 'Referral statistics retrieved successfully',
      messageAr: 'تم استرجاع إحصائيات الإحالة بنجاح',
      data: {
        referralCode: user.subscriberCode,
        statistics: {
          totalReferrals: user.referralCount || 0,
          customerReferrals: user.customerReferrals || 0,
          memberReferrals: user.memberReferrals || 0,
          activeDownline: user.downline ? user.downline.length : 0
        },
        recentReferrals,
        downlineMembers: user.downline || []
      }
    });

  } catch (error) {
    console.error('Error in getReferralStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

// @desc    Get all referrals made by member (Admin view)
// @route   GET /api/referrals/member/:memberId
// @access  Private (Admin only)
exports.getMemberReferrals = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Check if requesting user is admin
    if (!['super_admin', 'regional_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
        messageAr: 'الوصول مرفوض. للمشرفين فقط'
      });
    }

    const member = await User.findById(memberId)
      .select('name subscriberCode customerReferrals memberReferrals referralCount region')
      .populate('region', 'name nameAr code');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
        messageAr: 'العضو غير موجود'
      });
    }

    // If regional admin, check if member is in their region
    if (req.user.role === 'regional_admin') {
      if (!member.region || member.region._id.toString() !== req.user.region.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view members from your region',
          messageAr: 'يمكنك فقط مشاهدة أعضاء منطقتك'
        });
      }
    }

    // Get all referrals made by this member
    const referrals = await User.find({ sponsorId: memberId })
      .sort({ createdAt: -1 })
      .select('name username subscriberCode role createdAt isActive');

    res.status(200).json({
      success: true,
      message: 'Member referrals retrieved successfully',
      messageAr: 'تم استرجاع إحالات العضو بنجاح',
      data: {
        member: {
          name: member.name,
          subscriberCode: member.subscriberCode,
          region: member.region
        },
        statistics: {
          totalReferrals: member.referralCount || 0,
          customerReferrals: member.customerReferrals || 0,
          memberReferrals: member.memberReferrals || 0
        },
        referrals,
        totalCount: referrals.length
      }
    });

  } catch (error) {
    console.error('Error in getMemberReferrals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};

// @desc    Get top referrers (leaderboard)
// @route   GET /api/referrals/leaderboard
// @access  Private (Admin only)
exports.getReferralLeaderboard = async (req, res) => {
  try {
    // Check if requesting user is admin
    if (!['super_admin', 'regional_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
        messageAr: 'الوصول مرفوض. للمشرفين فقط'
      });
    }

    const { limit = 10, type = 'all' } = req.query;
    let query = { role: 'member', isActive: true };

    // Regional admin sees only their region
    if (req.user.role === 'regional_admin') {
      query.region = req.user.region;
    }

    let sortField = {};
    if (type === 'customers') {
      sortField = { customerReferrals: -1 };
    } else if (type === 'members') {
      sortField = { memberReferrals: -1 };
    } else {
      sortField = { referralCount: -1 };
    }

    const topReferrers = await User.find(query)
      .sort(sortField)
      .limit(parseInt(limit))
      .select('name subscriberCode customerReferrals memberReferrals referralCount region')
      .populate('region', 'name nameAr code');

    res.status(200).json({
      success: true,
      message: 'Referral leaderboard retrieved successfully',
      messageAr: 'تم استرجاع قائمة المتصدرين بنجاح',
      data: {
        type,
        topReferrers,
        count: topReferrers.length
      }
    });

  } catch (error) {
    console.error('Error in getReferralLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      messageAr: 'خطأ في الخادم',
      error: error.message
    });
  }
};
