const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    إرسال تهنئة لجميع الأعضاء (سوبر أدمن فقط)
 * @route   POST /api/greetings/send-all
 * @access  Private (Super Admin only)
 */
exports.sendGreetingToAll = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { title, titleAr, message, messageAr, link } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // جلب جميع الأعضاء النشطين
    const users = await User.find({ isActive: true }).select('_id');

    // إرسال التهنئة لكل عضو
    const notifications = [];

    for (const user of users) {
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user.id,
        type: 'greeting',
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        link: link || null,
        data: {
          from: 'company',
          sentBy: req.user.name,
          sentAt: new Date()
        }
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `تم إرسال التهنئة لـ ${notifications.length} عضو`
    });
  } catch (error) {
    console.error('Send greeting to all error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال التهنئة',
      error: error.message
    });
  }
};

/**
 * @desc    إرسال تهنئة لأعضاء منطقة معينة
 * @route   POST /api/greetings/send-region
 * @access  Private (Super Admin, Regional Admin)
 */
exports.sendGreetingToRegion = async (req, res) => {
  try {
    const { regionId, title, titleAr, message, messageAr, link } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // تحديد المنطقة
    let targetRegionId;

    if (req.user.role === 'regional_admin') {
      // الأدمن الإقليمي يرسل فقط لمنطقته
      targetRegionId = req.user.region;
    } else if (req.user.role === 'super_admin') {
      // السوبر أدمن يمكنه تحديد أي منطقة
      if (!regionId) {
        return res.status(400).json({
          success: false,
          message: 'Region ID is required for super admin'
        });
      }
      targetRegionId = regionId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // جلب أعضاء المنطقة النشطين
    const users = await User.find({
      region: targetRegionId,
      isActive: true
    }).select('_id');

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active users found in this region'
      });
    }

    // إرسال التهنئة لكل عضو في المنطقة
    const notifications = [];

    for (const user of users) {
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user.id,
        type: 'greeting',
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        link: link || null,
        data: {
          from: 'regional_admin',
          region: targetRegionId,
          sentBy: req.user.name,
          sentAt: new Date()
        }
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `تم إرسال التهنئة لـ ${notifications.length} عضو في المنطقة`
    });
  } catch (error) {
    console.error('Send greeting to region error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال التهنئة',
      error: error.message
    });
  }
};

/**
 * @desc    إرسال تهنئة لشخص محدد
 * @route   POST /api/greetings/send-to-member
 * @access  Private (Super Admin, Regional Admin)
 */
exports.sendGreetingToMember = async (req, res) => {
  try {
    const { userId, title, titleAr, message, messageAr, link } = req.body;

    // Validation
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and message are required'
      });
    }

    // التحقق من وجود المستخدم
    const targetUser = await User.findById(userId).populate('region', 'name nameAr code');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'regional_admin') {
      // الأدمن الإقليمي يمكنه إرسال فقط لأعضاء منطقته
      if (targetUser.region._id.toString() !== req.user.region.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only send greetings to members in your region'
        });
      }
    }

    // إرسال التهنئة
    const notification = await Notification.create({
      recipient: userId,
      sender: req.user.id,
      type: 'greeting',
      title,
      titleAr: titleAr || title,
      message,
      messageAr: messageAr || message,
      link: link || null,
      data: {
        from: 'personal',
        sentBy: req.user.name,
        sentByRole: req.user.role,
        sentAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      notification,
      message: `تم إرسال التهنئة إلى ${targetUser.name}`
    });
  } catch (error) {
    console.error('Send greeting to member error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال التهنئة',
      error: error.message
    });
  }
};

/**
 * @desc    إرسال تهنئة لمجموعة محددة من الأعضاء
 * @route   POST /api/greetings/send-to-multiple
 * @access  Private (Super Admin, Regional Admin)
 */
exports.sendGreetingToMultiple = async (req, res) => {
  try {
    const { userIds, title, titleAr, message, messageAr, link } = req.body;

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // جلب المستخدمين
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true
    }).select('_id name region').populate('region', '_id');

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active users found'
      });
    }

    // التحقق من الصلاحيات للأدمن الإقليمي
    if (req.user.role === 'regional_admin') {
      // التحقق من أن جميع المستخدمين من منطقته
      const invalidUsers = users.filter(
        user => user.region._id.toString() !== req.user.region.toString()
      );

      if (invalidUsers.length > 0) {
        return res.status(403).json({
          success: false,
          message: `You can only send greetings to members in your region. ${invalidUsers.length} user(s) are from different regions.`
        });
      }
    }

    // إرسال التهنئة لكل عضو
    const notifications = [];

    for (const user of users) {
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user.id,
        type: 'greeting',
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        link: link || null,
        data: {
          from: 'group',
          sentBy: req.user.name,
          sentByRole: req.user.role,
          sentAt: new Date()
        }
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `تم إرسال التهنئة لـ ${notifications.length} عضو`
    });
  } catch (error) {
    console.error('Send greeting to multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال التهنئة',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على سجل التهاني المرسلة
 * @route   GET /api/greetings/history
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getGreetingsHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    // بناء query حسب الصلاحيات
    const query = {
      sender: req.user.id,
      type: 'greeting'
    };

    const notifications = await Notification.find(query)
      .populate('recipient', 'name email subscriberCode region')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);

    // تجميع الإحصائيات
    const stats = {
      totalSent: total,
      sentToday: await Notification.countDocuments({
        ...query,
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      sentThisWeek: await Notification.countDocuments({
        ...query,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      sentThisMonth: await Notification.countDocuments({
        ...query,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      })
    };

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasMore: parseInt(page) * parseInt(limit) < total
      },
      greetings: notifications
    });
  } catch (error) {
    console.error('Get greetings history error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل التهاني',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على قوالب تهاني جاهزة
 * @route   GET /api/greetings/templates
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getGreetingTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'eid',
        nameAr: 'عيد سعيد',
        titleAr: 'عيد مبارك',
        title: 'Happy Eid',
        messageAr: 'كل عام وأنتم بخير بمناسبة عيد الفطر المبارك. أعاده الله علينا وعليكم بالخير واليمن والبركات.',
        message: 'Wishing you a blessed Eid filled with joy and prosperity.',
        icon: '🌙'
      },
      {
        id: 'new_year',
        nameAr: 'رأس السنة',
        titleAr: 'كل عام وأنتم بخير',
        title: 'Happy New Year',
        messageAr: 'نتمنى لكم عاماً جديداً مليئاً بالنجاح والسعادة والتوفيق في جميع مجالات حياتكم.',
        message: 'Wishing you a new year full of success, happiness and prosperity.',
        icon: '🎉'
      },
      {
        id: 'ramadan',
        nameAr: 'رمضان كريم',
        titleAr: 'رمضان مبارك',
        title: 'Happy Ramadan',
        messageAr: 'رمضان كريم! نسأل الله أن يتقبل منا ومنكم الصيام والقيام وصالح الأعمال.',
        message: 'Ramadan Kareem! May this holy month bring you peace and blessings.',
        icon: '☪️'
      },
      {
        id: 'birthday',
        nameAr: 'عيد ميلاد',
        titleAr: 'عيد ميلاد سعيد',
        title: 'Happy Birthday',
        messageAr: 'كل عام وأنت بخير! نتمنى لك عاماً جديداً مليئاً بالصحة والسعادة والنجاح.',
        message: 'Happy Birthday! Wishing you a year filled with health, happiness and success.',
        icon: '🎂'
      },
      {
        id: 'achievement',
        nameAr: 'تهنئة بالإنجاز',
        titleAr: 'مبروك الإنجاز',
        title: 'Congratulations',
        messageAr: 'ألف مبروك على هذا الإنجاز الرائع! نحن فخورون بك وبما حققته.',
        message: 'Congratulations on your amazing achievement! We are proud of you.',
        icon: '🏆'
      },
      {
        id: 'promotion',
        nameAr: 'تهنئة بالترقية',
        titleAr: 'مبروك الترقية',
        title: 'Promotion Congratulations',
        messageAr: 'ألف مبروك على الترقية المستحقة! نتمنى لك المزيد من النجاح والتقدم.',
        message: 'Congratulations on your well-deserved promotion! Wishing you continued success.',
        icon: '📈'
      },
      {
        id: 'thank_you',
        nameAr: 'شكر وتقدير',
        titleAr: 'شكراً لك',
        title: 'Thank You',
        messageAr: 'نشكرك على جهودك المتميزة وإخلاصك في العمل. أنت جزء مهم من عائلتنا.',
        message: 'Thank you for your outstanding efforts and dedication. You are a valuable member of our family.',
        icon: '🙏'
      },
      {
        id: 'general',
        nameAr: 'تهنئة عامة',
        titleAr: 'تحية وتقدير',
        title: 'Greetings',
        messageAr: 'نرسل لكم أطيب التحيات والتمنيات بدوام التوفيق والنجاح.',
        message: 'Sending you our warmest greetings and best wishes for continued success.',
        icon: '💐'
      }
    ];

    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get greeting templates error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب القوالب',
      error: error.message
    });
  }
};

module.exports = exports;
