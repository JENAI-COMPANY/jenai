/**
 * حساب عمولة القيادة للعضو
 * بناءً على مجموع النقاط الشخصية لأعضاء كل جيل
 *
 * مثال:
 * - عضو برونزي لديه جيل 1 بمجموع نقاط شخصية = 1000
 * - عمولة القيادة = 1000 × 5% = 50 نقطة
 */

const User = require('../models/User');

const LEADERSHIP_RATES = {
  'agent': [],
  'bronze': [0.05], // برونزي: 5% من جيل 1 فقط
  'silver': [0.05, 0.04], // فضي: 5% من جيل 1 + 4% من جيل 2
  'gold': [0.05, 0.04, 0.03], // ذهبي: 5% + 4% + 3% من أجيال 1+2+3
  'ruby': [0.05, 0.04, 0.03, 0.02], // ياقوتي: 5% + 4% + 3% + 2% من أجيال 1+2+3+4
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // ماسي وما فوق: جميع الأجيال الخمسة
  'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
  'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
  'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
};

/**
 * حساب عمولة القيادة للعضو
 * @param {String} memberId - معرف العضو
 * @returns {Number} - نقاط عمولة القيادة
 */
async function calculateLeadershipCommission(memberId) {
  try {
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return 0;
    }

    const rank = member.memberRank || 'agent';
    const leadershipRates = LEADERSHIP_RATES[rank] || [];

    if (leadershipRates.length === 0) {
      return 0; // لا يوجد عمولة قيادة للوكلاء
    }

    let totalLeadershipPoints = 0;

    // لكل جيل، احسب مجموع النقاط الشخصية لأعضاء ذلك الجيل
    for (let genLevel = 0; genLevel < leadershipRates.length; genLevel++) {
      const rate = leadershipRates[genLevel];

      // جلب أعضاء هذا الجيل
      const generationMembers = await getGenerationMembers(memberId, genLevel + 1);

      // حساب مجموع النقاط الشخصية
      const totalPersonalPoints = generationMembers.reduce((sum, m) => {
        return sum + (m.personalPoints || 0);
      }, 0);

      // حساب عمولة القيادة من هذا الجيل
      const leadershipPoints = totalPersonalPoints * rate;
      totalLeadershipPoints += leadershipPoints;

      console.log(`💎 ${member.name} - جيل ${genLevel + 1}: ${generationMembers.length} أعضاء، ${totalPersonalPoints} نقطة شخصية، عمولة قيادة: ${leadershipPoints.toFixed(2)} نقطة (${(rate * 100)}%)`);
    }

    return totalLeadershipPoints;
  } catch (error) {
    console.error('❌ خطأ في حساب عمولة القيادة:', error);
    return 0;
  }
}

/**
 * جلب أعضاء جيل معين
 * @param {String} memberId - معرف العضو
 * @param {Number} generationLevel - مستوى الجيل (1 = أبناء مباشرون، 2 = أحفاد، إلخ)
 * @returns {Array} - مصفوفة الأعضاء
 */
async function getGenerationMembers(memberId, generationLevel) {
  if (generationLevel === 1) {
    // الجيل الأول: الأبناء المباشرون
    return await User.find({
      referredBy: memberId,
      role: 'member'
    }).select('personalPoints').lean();
  }

  // الأجيال التالية: ابحث بشكل تكراري
  const directChildren = await User.find({
    referredBy: memberId,
    role: 'member'
  }).select('_id').lean();

  if (directChildren.length === 0) {
    return [];
  }

  let generationMembers = [];
  for (const child of directChildren) {
    const childGenerationMembers = await getGenerationMembers(child._id.toString(), generationLevel - 1);
    generationMembers = generationMembers.concat(childGenerationMembers);
  }

  return generationMembers;
}

/**
 * تحديث عمولة القيادة للعضو
 * @param {String} memberId - معرف العضو
 */
async function updateMemberLeadershipCommission(memberId) {
  try {
    const leadershipPoints = await calculateLeadershipCommission(memberId);

    const member = await User.findById(memberId);
    if (!member) return;

    // حساب الفرق في العمولة
    const oldLeadershipPoints = member.leadershipPoints || 0;
    const pointsDiff = leadershipPoints - oldLeadershipPoints;
    const commissionDiff = Math.floor(pointsDiff * 0.55);

    // تحديث نقاط القيادة
    member.leadershipPoints = leadershipPoints;

    // تحديث العمولة الإجمالية
    member.totalCommission = (member.totalCommission || 0) + commissionDiff;
    member.availableCommission = (member.availableCommission || 0) + commissionDiff;

    await member.save();

    console.log(`✅ تم تحديث عمولة القيادة لـ ${member.name}: ${oldLeadershipPoints.toFixed(2)} → ${leadershipPoints.toFixed(2)} نقطة (${commissionDiff > 0 ? '+' : ''}${commissionDiff} شيكل)`);

    return {
      oldPoints: oldLeadershipPoints,
      newPoints: leadershipPoints,
      commissionDiff
    };
  } catch (error) {
    console.error('❌ خطأ في تحديث عمولة القيادة:', error);
    return null;
  }
}

/**
 * تحديث عمولة القيادة لجميع أعضاء السلسلة العلوية
 * يُستدعى بعد تحديث نقاط عضو (من طلب أو إضافة يدوية)
 * @param {String} memberId - معرف العضو الذي تم تحديث نقاطه
 */
async function updateUplineLeadershipCommissions(memberId) {
  try {
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') return;

    console.log(`🔄 تحديث عمولة القيادة للسلسلة العلوية لـ ${member.name}...`);

    // تحديث عمولة القيادة لأعلى 5 أجيال
    let currentMemberId = member.referredBy;
    let level = 1;

    while (currentMemberId && level <= 5) {
      const uplineMember = await User.findById(currentMemberId);
      if (!uplineMember || uplineMember.role !== 'member') break;

      // تحديث عمولة القيادة لهذا العضو
      await updateMemberLeadershipCommission(currentMemberId);

      currentMemberId = uplineMember.referredBy;
      level++;
    }

    console.log(`✅ اكتمل تحديث عمولة القيادة للسلسلة العلوية`);
  } catch (error) {
    console.error('❌ خطأ في تحديث عمولة القيادة للسلسلة:', error);
  }
}

module.exports = {
  calculateLeadershipCommission,
  updateMemberLeadershipCommission,
  updateUplineLeadershipCommissions,
  getGenerationMembers,
  LEADERSHIP_RATES
};
