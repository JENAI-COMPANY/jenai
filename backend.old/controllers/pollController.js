const Poll = require('../models/Poll');
const User = require('../models/User');
const Region = require('../models/Region');

/**
 * @desc    إنشاء استفتاء جديد
 * @route   POST /api/polls
 * @access  Private (Super Admin, Regional Admin)
 */
exports.createPoll = async (req, res) => {
  try {
    const {
      question,
      questionAr,
      description,
      descriptionAr,
      options,
      scope,
      targetRegion,
      endDate,
      settings
    } = req.body;

    // Validation
    if (!question || !questionAr) {
      return res.status(400).json({
        success: false,
        message: 'Question in both languages is required'
      });
    }

    if (!options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 options are required'
      });
    }

    // التحقق من الصلاحيات
    let pollScope = scope;
    let pollRegion = null;

    if (req.user.role === 'regional_admin') {
      // الأدمن الإقليمي يمكنه إنشاء استفتاءات لمنطقته فقط
      pollScope = 'region';
      pollRegion = req.user.region;
    } else if (req.user.role === 'super_admin') {
      // السوبر أدمن يمكنه الاختيار
      if (scope === 'region') {
        if (!targetRegion) {
          return res.status(400).json({
            success: false,
            message: 'Target region is required for regional polls'
          });
        }
        pollRegion = targetRegion;
      }
    }

    // إنشاء الاستفتاء
    const poll = await Poll.create({
      question,
      questionAr,
      description,
      descriptionAr,
      options,
      createdBy: req.user.id,
      scope: pollScope,
      targetRegion: pollRegion,
      endDate: endDate || null,
      settings: settings || {},
      status: 'active'
    });

    await poll.populate('createdBy', 'name role');
    if (pollRegion) {
      await poll.populate('targetRegion', 'name nameAr code');
    }

    res.status(201).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating poll',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على جميع الاستفتاءات
 * @route   GET /api/polls
 * @access  Public (للأعضاء)
 */
exports.getAllPolls = async (req, res) => {
  try {
    const { status, scope, active = 'true' } = req.query;

    let query = { isActive: active === 'true' };

    // تصفية حسب الحالة
    if (status) {
      query.status = status;
    }

    // تصفية حسب النطاق للأعضاء
    if (req.user) {
      // إذا كان المستخدم لديه منطقة، يرى استفتاءات منطقته + الاستفتاءات العامة
      if (req.user.region) {
        query.$or = [
          { scope: 'all' },
          { scope: 'region', targetRegion: req.user.region }
        ];
      } else {
        // إذا لم يكن لديه منطقة، يرى الاستفتاءات العامة فقط
        query.scope = 'all';
      }
    } else {
      // للزوار - استفتاءات عامة فقط
      query.scope = 'all';
    }

    const polls = await Poll.find(query)
      .populate('createdBy', 'name role')
      .populate('targetRegion', 'name nameAr code')
      .sort('-createdAt');

    // إخفاء معلومات المصوتين إذا كان التصويت مجهولاً
    const pollsData = polls.map(poll => {
      const pollObj = poll.toObject();

      // إخفاء بيانات المصوتين إذا كان مجهولاً
      if (poll.settings.anonymousVoting) {
        pollObj.options = pollObj.options.map(option => ({
          _id: option._id,
          text: option.text,
          textAr: option.textAr,
          votes: option.votes
          // لا نرسل voters
        }));
        delete pollObj.voters;
      }

      // التحقق من تصويت المستخدم الحالي
      if (req.user) {
        pollObj.hasVoted = poll.hasUserVoted(req.user.id);
      }

      return pollObj;
    });

    res.status(200).json({
      success: true,
      count: pollsData.length,
      polls: pollsData
    });
  } catch (error) {
    console.error('Get all polls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching polls',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على استفتاء واحد
 * @route   GET /api/polls/:id
 * @access  Public
 */
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('targetRegion', 'name nameAr code');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const pollObj = poll.toObject();

    // التحقق من الصلاحيات
    if (req.user) {
      // التحقق من تصويت المستخدم
      pollObj.hasVoted = poll.hasUserVoted(req.user.id);

      // التحقق من إمكانية التصويت
      pollObj.canVote = poll.canVote() && !pollObj.hasVoted;

      // إخفاء بيانات المصوتين إذا كان مجهولاً
      if (poll.settings.anonymousVoting) {
        pollObj.options = pollObj.options.map(option => ({
          _id: option._id,
          text: option.text,
          textAr: option.textAr,
          votes: option.votes
        }));
        delete pollObj.voters;
      }
    }

    // حساب النسب المئوية
    pollObj.results = poll.calculatePercentages();

    res.status(200).json({
      success: true,
      poll: pollObj
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching poll',
      error: error.message
    });
  }
};

/**
 * @desc    التصويت في استفتاء
 * @route   POST /api/polls/:id/vote
 * @access  Private (Members)
 */
exports.votePoll = async (req, res) => {
  try {
    const { optionIds } = req.body;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one option'
      });
    }

    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // التحقق من صلاحية التصويت
    if (!poll.canVote()) {
      return res.status(400).json({
        success: false,
        message: 'This poll is closed or expired'
      });
    }

    // التحقق من تصويت المستخدم سابقاً
    if (poll.hasUserVoted(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // التحقق من عدد الخيارات
    if (!poll.settings.allowMultipleVotes && optionIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one option is allowed'
      });
    }

    // التحقق من صحة الخيارات
    const validOptionIds = poll.options.map(opt => opt._id.toString());
    const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));

    if (invalidOptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option ID(s)'
      });
    }

    // إضافة التصويت
    optionIds.forEach(optionId => {
      const option = poll.options.id(optionId);
      if (option) {
        option.votes += 1;
        option.voters.push(req.user.id);
      }
    });

    // إضافة المستخدم للمصوتين
    poll.voters.push({
      user: req.user.id,
      votedAt: new Date(),
      selectedOptions: optionIds
    });

    // تحديث الإحصائيات
    poll.totalVotes += optionIds.length;
    poll.totalVoters += 1;

    await poll.save();

    // إعادة جلب الاستفتاء مع البيانات المحدثة
    const updatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'name role')
      .populate('targetRegion', 'name nameAr code');

    const pollObj = updatedPoll.toObject();
    pollObj.hasVoted = true;
    pollObj.canVote = false;
    pollObj.results = updatedPoll.calculatePercentages();

    // إخفاء بيانات المصوتين إذا كان مجهولاً
    if (updatedPoll.settings.anonymousVoting) {
      pollObj.options = pollObj.options.map(option => ({
        _id: option._id,
        text: option.text,
        textAr: option.textAr,
        votes: option.votes
      }));
      delete pollObj.voters;
    }

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      poll: pollObj
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
};

/**
 * @desc    تحديث استفتاء
 * @route   PUT /api/polls/:id
 * @access  Private (Creator or Super Admin)
 */
exports.updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // التحقق من الصلاحيات
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this poll'
      });
    }

    // لا يمكن تعديل استفتاء له أصوات
    if (poll.totalVotes > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update poll that has votes. You can only close it.'
      });
    }

    const {
      question,
      questionAr,
      description,
      descriptionAr,
      options,
      endDate,
      status,
      settings
    } = req.body;

    // تحديث الحقول
    if (question) poll.question = question;
    if (questionAr) poll.questionAr = questionAr;
    if (description !== undefined) poll.description = description;
    if (descriptionAr !== undefined) poll.descriptionAr = descriptionAr;
    if (options) poll.options = options;
    if (endDate !== undefined) poll.endDate = endDate;
    if (status) poll.status = status;
    if (settings) poll.settings = { ...poll.settings, ...settings };

    await poll.save();

    await poll.populate('createdBy', 'name role');
    await poll.populate('targetRegion', 'name nameAr code');

    res.status(200).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating poll',
      error: error.message
    });
  }
};

/**
 * @desc    حذف استفتاء
 * @route   DELETE /api/polls/:id
 * @access  Private (Creator or Super Admin)
 */
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // التحقق من الصلاحيات
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this poll'
      });
    }

    // حذف ناعم
    poll.isActive = false;
    poll.status = 'archived';
    await poll.save();

    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting poll',
      error: error.message
    });
  }
};

/**
 * @desc    إغلاق استفتاء
 * @route   PUT /api/polls/:id/close
 * @access  Private (Creator or Super Admin)
 */
exports.closePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // التحقق من الصلاحيات
    if (poll.createdBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to close this poll'
      });
    }

    poll.status = 'closed';
    poll.endDate = new Date();
    await poll.save();

    await poll.populate('createdBy', 'name role');
    await poll.populate('targetRegion', 'name nameAr code');

    res.status(200).json({
      success: true,
      message: 'Poll closed successfully',
      poll
    });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing poll',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على نتائج استفتاء مفصلة (للأدمن)
 * @route   GET /api/polls/:id/results
 * @access  Private (Creator, Super Admin, Regional Admin)
 */
exports.getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('targetRegion', 'name nameAr code')
      .populate('voters.user', 'name email subscriberCode region')
      .populate({
        path: 'voters.user',
        populate: {
          path: 'region',
          select: 'name nameAr code'
        }
      });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // التحقق من الصلاحيات
    const isCreator = poll.createdBy._id.toString() === req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    const isRegionalAdmin = req.user.role === 'regional_admin' &&
                            poll.targetRegion &&
                            poll.targetRegion._id.toString() === req.user.region.toString();

    if (!isCreator && !isSuperAdmin && !isRegionalAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view detailed results'
      });
    }

    // حساب النتائج التفصيلية
    const results = {
      poll: {
        _id: poll._id,
        question: poll.question,
        questionAr: poll.questionAr,
        status: poll.status,
        scope: poll.scope,
        targetRegion: poll.targetRegion,
        totalVotes: poll.totalVotes,
        totalVoters: poll.totalVoters,
        createdAt: poll.createdAt,
        endDate: poll.endDate
      },
      options: poll.options.map(option => {
        const percentage = poll.totalVotes > 0
          ? ((option.votes / poll.totalVotes) * 100).toFixed(2)
          : 0;

        return {
          _id: option._id,
          text: option.text,
          textAr: option.textAr,
          votes: option.votes,
          percentage: parseFloat(percentage),
          voters: poll.settings.anonymousVoting ? undefined : option.voters
        };
      }),
      voters: poll.settings.anonymousVoting ? undefined : poll.voters,
      demographics: {
        byRegion: {},
        byDate: {}
      }
    };

    // تحليل حسب المنطقة
    if (!poll.settings.anonymousVoting) {
      poll.voters.forEach(voter => {
        if (voter.user && voter.user.region) {
          const regionName = voter.user.region.nameAr || voter.user.region.name;
          results.demographics.byRegion[regionName] = (results.demographics.byRegion[regionName] || 0) + 1;
        }
      });

      // تحليل حسب التاريخ
      poll.voters.forEach(voter => {
        const date = new Date(voter.votedAt).toLocaleDateString('ar');
        results.demographics.byDate[date] = (results.demographics.byDate[date] || 0) + 1;
      });
    }

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching poll results',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على استفتاءاتي (التي أنشأتها)
 * @route   GET /api/polls/my-polls
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getMyPolls = async (req, res) => {
  try {
    const polls = await Poll.find({
      createdBy: req.user.id,
      isActive: true
    })
      .populate('targetRegion', 'name nameAr code')
      .sort('-createdAt');

    const pollsWithStats = polls.map(poll => {
      const pollObj = poll.toObject();
      pollObj.results = poll.calculatePercentages();
      return pollObj;
    });

    res.status(200).json({
      success: true,
      count: pollsWithStats.length,
      polls: pollsWithStats
    });
  } catch (error) {
    console.error('Get my polls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your polls',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على إحصائيات الاستفتاءات (للأدمن)
 * @route   GET /api/polls/admin/statistics
 * @access  Private (Super Admin, Regional Admin)
 */
exports.getPollStatistics = async (req, res) => {
  try {
    let query = { isActive: true };

    // للأدمن الإقليمي - استفتاءات منطقته فقط
    if (req.user.role === 'regional_admin') {
      query.$or = [
        { createdBy: req.user.id },
        { targetRegion: req.user.region }
      ];
    }

    const polls = await Poll.find(query);

    const stats = {
      total: polls.length,
      active: polls.filter(p => p.status === 'active').length,
      closed: polls.filter(p => p.status === 'closed').length,
      draft: polls.filter(p => p.status === 'draft').length,
      totalVotes: polls.reduce((sum, p) => sum + p.totalVotes, 0),
      totalVoters: polls.reduce((sum, p) => sum + p.totalVoters, 0),
      averageVotesPerPoll: 0,
      mostVotedPoll: null,
      recentPolls: []
    };

    stats.averageVotesPerPoll = stats.total > 0
      ? (stats.totalVotes / stats.total).toFixed(2)
      : 0;

    // الاستفتاء الأكثر تصويتاً
    if (polls.length > 0) {
      const sorted = [...polls].sort((a, b) => b.totalVotes - a.totalVotes);
      stats.mostVotedPoll = {
        _id: sorted[0]._id,
        question: sorted[0].question,
        questionAr: sorted[0].questionAr,
        totalVotes: sorted[0].totalVotes
      };
    }

    // أحدث الاستفتاءات
    const recent = [...polls]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    stats.recentPolls = recent.map(p => ({
      _id: p._id,
      question: p.question,
      questionAr: p.questionAr,
      status: p.status,
      totalVotes: p.totalVotes,
      createdAt: p.createdAt
    }));

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get poll statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = exports;
