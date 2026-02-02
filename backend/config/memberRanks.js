/**
 * نظام الرتب للأعضاء - 9 رتب
 *
 * النقاط التراكمية = النقاط الشخصية + نقاط الفريق (المستويات الخمسة)
 * الخطوط البرونزية = عدد الأعضاء البرونزيين في المستوى الأول فقط
 */

const User = require('../models/User');

// Mapping between rank numbers and enum values in User model
const RANK_ENUM_MAP = {
  1: 'agent',
  2: 'bronze',
  3: 'silver',
  4: 'gold',
  5: 'ruby',
  6: 'diamond',
  7: 'double_diamond',
  8: 'regional_ambassador',
  9: 'global_ambassador'
};

const MEMBER_RANKS = {
  1: {
    name: 'وكيل',
    nameEn: 'Agent',
    minCumulativePoints: 0,
    minBronzeLines: 0,
    description: 'كل عضو جديد من لحظة تسجيله',
    descriptionEn: 'Every new member from registration',
    // لا يحصل على عمولة قيادة
    leadershipCommission: {
      generation1: 0,
      generation2: 0,
      generation3: 0,
      generation4: 0,
      generation5: 0
    }
  },
  2: {
    name: 'برونزي',
    nameEn: 'Bronze',
    minCumulativePoints: 4000,
    minBronzeLines: 0,
    description: 'يحتاج 4000 نقطة تراكمية (شخصية + فريق)',
    descriptionEn: 'Requires 4000 cumulative points (personal + team)',
    // عمولة القيادة: الجيل الأول فقط 5%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0,
      generation3: 0,
      generation4: 0,
      generation5: 0
    }
  },
  3: {
    name: 'فضي',
    nameEn: 'Silver',
    minCumulativePoints: 4000,
    minBronzeLines: 1,
    description: 'خط عمودي واحد وصل رتبة برونزي',
    descriptionEn: '1 Bronze line in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0,
      generation5: 0
    }
  },
  4: {
    name: 'ذهبي',
    nameEn: 'Gold',
    minCumulativePoints: 4000,
    minBronzeLines: 2,
    description: 'خطان عموديان وصلا رتبة برونزي',
    descriptionEn: '2 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0,
      generation4: 0,
      generation5: 0
    }
  },
  5: {
    name: 'ياقوتي',
    nameEn: 'Ruby',
    minCumulativePoints: 4000,
    minBronzeLines: 3,
    description: '3 خطوط برونزية في المستوى الأول',
    descriptionEn: '3 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3% + الرابع 2%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0.02,  // 2%
      generation5: 0
    }
  },
  6: {
    name: 'ماسي',
    nameEn: 'Diamond',
    minCumulativePoints: 4000,
    minBronzeLines: 6,
    description: '6 خطوط برونزية في المستوى الأول',
    descriptionEn: '6 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3% + الرابع 2% + الخامس 1%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0.02,  // 2%
      generation5: 0.01   // 1%
    }
  },
  7: {
    name: 'ماسي ثنائي',
    nameEn: 'Double Diamond',
    minCumulativePoints: 4000,
    minBronzeLines: 10,
    description: '10 خطوط برونزية في المستوى الأول',
    descriptionEn: '10 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3% + الرابع 2% + الخامس 1%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0.02,  // 2%
      generation5: 0.01   // 1%
    }
  },
  8: {
    name: 'سفير إقليمي',
    nameEn: 'Regional Ambassador',
    minCumulativePoints: 4000,
    minBronzeLines: 14,
    description: '14 خط برونزي في المستوى الأول',
    descriptionEn: '14 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3% + الرابع 2% + الخامس 1%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0.02,  // 2%
      generation5: 0.01   // 1%
    }
  },
  9: {
    name: 'سفير عالمي',
    nameEn: 'Global Ambassador',
    minCumulativePoints: 4000,
    minBronzeLines: 18,
    description: '18 خط برونزي في المستوى الأول',
    descriptionEn: '18 Bronze lines in first level',
    // عمولة القيادة: الجيل الأول 5% + الثاني 4% + الثالث 3% + الرابع 2% + الخامس 1%
    leadershipCommission: {
      generation1: 0.05,  // 5%
      generation2: 0.04,  // 4%
      generation3: 0.03,  // 3%
      generation4: 0.02,  // 2%
      generation5: 0.01   // 1%
    }
  }
};

/**
 * دالة حساب النقاط التراكمية للعضو (لحساب الرتبة)
 * @param {Object} user - بيانات العضو
 * @returns {Number} - النقاط التراكمية
 *
 * النقاط التراكمية = النقاط الشخصية (monthlyPoints) + نقاط المكافأة (bonusPoints) + نقاط التعويض (compensationPoints)
 * ملاحظة: نقاط الفريق (الأجيال) لا تُحسب للرتبة - فقط للربح
 */
const calculateCumulativePoints = (user) => {
  const personalPoints = user.monthlyPoints || 0;
  const bonusPoints = user.bonusPoints || 0;
  const compensationPoints = user.compensationPoints || 0;

  return personalPoints + bonusPoints + compensationPoints;
};

/**
 * دالة عد الخطوط البرونزية في المستوى الأول
 * @param {String} userId - معرف العضو
 * @param {Object} User - نموذج المستخدم
 * @returns {Number} - عدد الخطوط البرونزية
 */
const countBronzeLines = async (userId, User) => {
  try {
    // جلب الأعضاء في المستوى الأول (المباشرين)
    const directMembers = await User.find({
      sponsorId: userId,
      role: 'member'
    }).select('memberRank');

    // عد الأعضاء الذين وصلوا رتبة برونزي أو أعلى (الرتبة 2 فما فوق)
    const bronzeCount = directMembers.filter(member => {
      const rankNumber = getRankNumber(member.memberRank);
      return rankNumber >= 2;
    }).length;

    return bronzeCount;
  } catch (error) {
    console.error('Error counting bronze lines:', error);
    return 0;
  }
};

/**
 * دالة تحديد الرتبة المناسبة للعضو
 * @param {Number} cumulativePoints - النقاط التراكمية
 * @param {Number} bronzeLines - عدد الخطوط البرونزية
 * @returns {Number} - رقم الرتبة (1-9)
 */
const determineRank = (cumulativePoints, bronzeLines) => {
  // البحث عن أعلى رتبة يستحقها العضو
  let qualifiedRank = 1;

  for (let rank = 9; rank >= 1; rank--) {
    const rankConfig = MEMBER_RANKS[rank];

    if (cumulativePoints >= rankConfig.minCumulativePoints &&
        bronzeLines >= rankConfig.minBronzeLines) {
      qualifiedRank = rank;
      break;
    }
  }

  return qualifiedRank;
};

/**
 * دالة تحديث رتبة عضو واحد
 * @param {String} userId - معرف العضو
 * @param {Object} User - نموذج المستخدم
 * @returns {Object} - معلومات التحديث
 */
const updateMemberRank = async (userId, User) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.role !== 'member') {
      return { updated: false, message: 'User not found or not a member' };
    }

    // حساب النقاط التراكمية
    const cumulativePoints = calculateCumulativePoints(user);

    // عد الخطوط البرونزية
    const bronzeLines = await countBronzeLines(userId, User);

    // تحديد الرتبة الجديدة (كرقم)
    const newRankNumber = determineRank(cumulativePoints, bronzeLines);
    // تحويل الرقم إلى enum string
    const newRankEnum = RANK_ENUM_MAP[newRankNumber];

    // إذا تغيرت الرتبة، قم بالتحديث
    if (newRankEnum !== user.memberRank) {
      const oldRank = user.memberRank;
      user.memberRank = newRankEnum;
      await user.save();

      // تحديث رتبة الراعي (العضو الأعلى) لأن خطوطه البرونزية قد تغيرت
      if (user.sponsorId) {
        try {
          await updateMemberRank(user.sponsorId, User);
        } catch (err) {
          console.error('خطأ في تحديث رتبة الراعي:', err);
        }
      }

      return {
        updated: true,
        userId: user._id,
        username: user.username,
        oldRank,
        newRank: newRankEnum,
        newRankNumber,
        cumulativePoints,
        bronzeLines,
        rankName: MEMBER_RANKS[newRankNumber].name
      };
    }

    return {
      updated: false,
      message: 'Rank unchanged',
      currentRank: user.memberRank,
      cumulativePoints,
      bronzeLines
    };
  } catch (error) {
    console.error('Error updating member rank:', error);
    return { updated: false, error: error.message };
  }
};

/**
 * دالة تحديث رتب جميع الأعضاء
 * @param {Object} User - نموذج المستخدم
 * @returns {Array} - قائمة التحديثات
 */
const updateAllMembersRanks = async (User) => {
  try {
    const members = await User.find({ role: 'member' }).select('_id');
    const updates = [];

    for (const member of members) {
      const result = await updateMemberRank(member._id, User);
      if (result.updated) {
        updates.push(result);
      }
    }

    return {
      success: true,
      totalMembers: members.length,
      updatedMembers: updates.length,
      updates
    };
  } catch (error) {
    console.error('Error updating all members ranks:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * دالة تحويل اسم الرتبة إلى رقم
 * @param {String|Number} rank - اسم الرتبة أو رقمها
 * @returns {Number} - رقم الرتبة
 */
const getRankNumber = (rank) => {
  // إذا كان رقماً، إرجاعه مباشرة
  if (typeof rank === 'number') {
    return rank >= 1 && rank <= 9 ? rank : 1;
  }

  // تحويل النص إلى رقم
  const rankMap = {
    'agent': 1,
    'bronze': 2,
    'silver': 3,
    'gold': 4,
    'ruby': 5,
    'diamond': 6,
    'double_diamond': 7,
    'regional_ambassador': 8,
    'global_ambassador': 9
  };

  return rankMap[rank] || 1;
};

/**
 * دالة الحصول على معلومات الرتبة
 * @param {Number|String} rank - رقم الرتبة أو اسمها
 * @returns {Object} - معلومات الرتبة
 */
const getRankInfo = (rank) => {
  const rankNumber = getRankNumber(rank);
  return MEMBER_RANKS[rankNumber] || MEMBER_RANKS[1];
};

/**
 * دالة الحصول على متطلبات الرتبة التالية
 * @param {Number} currentRank - الرتبة الحالية
 * @param {Number} currentCumulativePoints - النقاط التراكمية الحالية
 * @param {Number} currentBronzeLines - الخطوط البرونزية الحالية
 * @returns {Object} - متطلبات الرتبة التالية
 */
const getNextRankRequirements = (currentRank, currentCumulativePoints, currentBronzeLines) => {
  if (currentRank >= 9) {
    return {
      hasNextRank: false,
      message: 'لقد وصلت إلى أعلى رتبة'
    };
  }

  const nextRank = currentRank + 1;
  const nextRankConfig = MEMBER_RANKS[nextRank];

  const pointsNeeded = Math.max(0, nextRankConfig.minCumulativePoints - currentCumulativePoints);
  const bronzeLinesNeeded = Math.max(0, nextRankConfig.minBronzeLines - currentBronzeLines);

  return {
    hasNextRank: true,
    nextRank,
    nextRankName: nextRankConfig.name,
    nextRankNameEn: nextRankConfig.nameEn,
    requirements: {
      cumulativePoints: nextRankConfig.minCumulativePoints,
      bronzeLines: nextRankConfig.minBronzeLines
    },
    needed: {
      points: pointsNeeded,
      bronzeLines: bronzeLinesNeeded
    },
    progress: {
      pointsProgress: currentCumulativePoints >= nextRankConfig.minCumulativePoints,
      bronzeLinesProgress: currentBronzeLines >= nextRankConfig.minBronzeLines
    }
  };
};

/**
 * دالة الحصول على جميع الرتب
 * @returns {Object} - جميع الرتب
 */
const getAllRanks = () => {
  return MEMBER_RANKS;
};

/**
 * دالة بناء هيكل الشبكة (5 مستويات)
 * @param {Object} User - نموذج المستخدم
 * @param {String} memberId - معرف العضو
 * @returns {Object} - هيكل الشبكة
 */
const getDownlineStructure = async (User, memberId) => {
  const structure = {
    level1: [],
    level2: [],
    level3: [],
    level4: [],
    level5: []
  };

  const buildStructure = async (currentMemberId, currentLevel) => {
    if (currentLevel > 5) return;

    const directMembers = await User.find({
      sponsorId: currentMemberId,
      role: 'member'
    }).select('name username subscriberCode monthlyPoints memberRank');

    if (!directMembers || directMembers.length === 0) {
      return;
    }

    const levelKey = `level${currentLevel}`;
    structure[levelKey] = directMembers;

    // بناء المستوى التالي بشكل متكرر
    for (const member of directMembers) {
      await buildStructure(member._id, currentLevel + 1);
    }
  };

  await buildStructure(memberId, 1);
  return structure;
};

/**
 * دالة حساب العمولة التقديرية من الشبكة
 * @param {Object} User - نموذج المستخدم
 * @param {String} memberId - معرف العضو
 * @returns {Number} - العمولة التقديرية
 */
const calculateDownlineCommission = async (User, memberId) => {
  const member = await User.findById(memberId);
  if (!member) return 0;

  const downlineStructure = await getDownlineStructure(User, memberId);

  // نسب العمولة من المستويات (ثابتة من نظام الأرباح)
  const GENERATION_COMMISSION_RATES = {
    level1: 0.11,  // 11%
    level2: 0.08,  // 8%
    level3: 0.06,  // 6%
    level4: 0.03,  // 3%
    level5: 0.02   // 2%
  };

  const POINTS_TO_SHEKEL_RATE = 0.55;

  let totalCommissionPoints = 0;

  // حساب العمولة من كل مستوى
  for (let level = 1; level <= 5; level++) {
    const levelKey = `level${level}`;
    const levelMembers = downlineStructure[levelKey];
    const commissionRate = GENERATION_COMMISSION_RATES[levelKey];

    for (const downlineMember of levelMembers) {
      const memberPoints = downlineMember.monthlyPoints || 0;
      const commissionPoints = memberPoints * commissionRate;
      totalCommissionPoints += commissionPoints;
    }
  }

  // تحويل النقاط إلى شيكل
  const commissionInShekel = totalCommissionPoints * POINTS_TO_SHEKEL_RATE;

  return commissionInShekel;
};

/**
 * دالة حساب عمولة القيادة (للأعضاء من رتبة برونزي وما فوق)
 * المعادلة: عدد نقاط الجيل × نسبة العمولة × 0.55
 * @param {Object} User - نموذج المستخدم
 * @param {String} memberId - معرف العضو
 * @returns {Object} - تفاصيل عمولة القيادة
 */
const calculateLeadershipCommission = async (User, memberId) => {
  const member = await User.findById(memberId);

  if (!member || member.role !== 'member') {
    return {
      totalCommission: 0,
      commissionInShekel: 0,
      breakdown: [],
      hasLeadershipCommission: false
    };
  }

  // تحويل الرتبة إلى رقم
  const memberRankNumber = getRankNumber(member.memberRank);

  // العضو يجب أن يكون برونزي أو أعلى (رتبة 2 فما فوق)
  if (memberRankNumber < 2) {
    return {
      totalCommission: 0,
      commissionInShekel: 0,
      breakdown: [],
      hasLeadershipCommission: false,
      message: 'عمولة القيادة متاحة للأعضاء من رتبة برونزي وما فوق'
    };
  }

  const rankConfig = getRankInfo(memberRankNumber);
  const leadershipRates = rankConfig.leadershipCommission;
  const POINTS_TO_SHEKEL_RATE = 0.55;

  const breakdown = [];
  let totalCommissionPoints = 0;

  // حساب عمولة القيادة من كل جيل حسب رتبة العضو
  const generations = [
    { key: 'generation1', points: member.generation1Points || 0, rate: leadershipRates.generation1 },
    { key: 'generation2', points: member.generation2Points || 0, rate: leadershipRates.generation2 },
    { key: 'generation3', points: member.generation3Points || 0, rate: leadershipRates.generation3 },
    { key: 'generation4', points: member.generation4Points || 0, rate: leadershipRates.generation4 },
    { key: 'generation5', points: member.generation5Points || 0, rate: leadershipRates.generation5 }
  ];

  for (let i = 0; i < generations.length; i++) {
    const gen = generations[i];

    if (gen.rate > 0 && gen.points > 0) {
      const commissionPoints = gen.points * gen.rate;
      totalCommissionPoints += commissionPoints;

      breakdown.push({
        generation: i + 1,
        generationPoints: gen.points,
        commissionRate: gen.rate,
        commissionRatePercent: (gen.rate * 100).toFixed(0) + '%',
        commissionPoints: commissionPoints,
        commissionInShekel: commissionPoints * POINTS_TO_SHEKEL_RATE
      });
    }
  }

  const commissionInShekel = totalCommissionPoints * POINTS_TO_SHEKEL_RATE;

  return {
    totalCommissionPoints,
    commissionInShekel,
    breakdown,
    hasLeadershipCommission: true,
    rankName: rankConfig.name,
    rankNameEn: rankConfig.nameEn
  };
};

module.exports = {
  MEMBER_RANKS,
  calculateCumulativePoints,
  countBronzeLines,
  determineRank,
  updateMemberRank,
  updateAllMembersRanks,
  getRankNumber,
  getRankInfo,
  getNextRankRequirements,
  getAllRanks,
  getDownlineStructure,
  calculateDownlineCommission,
  calculateLeadershipCommission
};
