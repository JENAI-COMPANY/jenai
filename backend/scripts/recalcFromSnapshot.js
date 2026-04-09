// سكريبت إعادة احتساب الأرباح من النسخة الاحتياطية - كل النقاط من snapshot
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const PointsSnapshot = require('../models/PointsSnapshot');
const PointTransaction = require('../models/PointTransaction');
const Order = require('../models/Order');
const { getRankInfo, getRankNumber } = require('../config/memberRanks');

const POINTS_TO_SHEKEL = 0.55;
const TEAM_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];

// بناء شجرة الأجيال من referredBy (iterative مع منع التكرار)
async function getGenIds(memberId) {
  const result = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const visited = new Set([memberId.toString()]);
  let currentIds = [memberId];

  for (let level = 1; level <= 5; level++) {
    if (currentIds.length === 0) break;
    const children = await User.find({ referredBy: { $in: currentIds }, role: 'member' }).select('_id').lean();
    const newIds = [];
    for (const c of children) {
      const idStr = c._id.toString();
      if (!visited.has(idStr)) {
        visited.add(idStr);
        newIds.push(c._id);
      }
    }
    result[level] = newIds;
    currentIds = newIds;
  }
  return result;
}

// حساب نقاط جيل من snapshot (monthlyPoints - bonusPoints خلال الفترة فقط)
function getNetPointsFromSnap(ids, snapMap, bonusByMember) {
  let total = 0;
  ids.forEach(id => {
    const sm = snapMap[id.toString()];
    if (sm) {
      const bonusInPeriod = bonusByMember[id.toString()] || 0;
      total += Math.max(0, (sm.monthlyPoints || 0) - bonusInPeriod);
    }
  });
  return total;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // 1. جلب الدورة
  const period = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  if (!period) { console.log('❌ Period not found'); process.exit(1); }
  console.log(`📅 الدورة: ${period.periodName} | ${period.startDate.toISOString().slice(0,10)} → ${period.endDate.toISOString().slice(0,10)}`);

  // 2. جلب الـ snapshot
  const snap = await PointsSnapshot.findOne({ periodName: period.periodName });
  if (!snap) { console.log('❌ Snapshot not found'); process.exit(1); }
  console.log(`📦 Snapshot: ${snap.members.length} عضو`);

  const snapMap = {};
  snap.members.forEach(m => { snapMap[m.memberId.toString()] = m; });

  // جلب نقاط البونص خلال الفترة فقط من PT (مثل expectedProfit بالضبط)
  const endDateObj2 = new Date(period.endDate);
  endDateObj2.setHours(23, 59, 59, 999);
  const bonusTxnsAll = await PointTransaction.find({
    type: 'bonus',
    earnedAt: { $gte: period.startDate, $lte: endDateObj2 }
  }).lean();
  const bonusByMember = {};
  bonusTxnsAll.forEach(t => {
    const id = t.memberId.toString();
    bonusByMember[id] = (bonusByMember[id] || 0) + t.points;
  });
  console.log(`📊 سجلات بونص خلال الفترة: ${bonusTxnsAll.length}`);

  // 3. جلب جميع الأعضاء
  const members = await User.find({ role: 'member' }).select('name username memberRank subscriberCode _id').lean();
  console.log(`👥 ${members.length} عضو`);

  const endDateObj = new Date(period.endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const membersProfits = [];
  let totalPerformanceProfits = 0, totalLeadershipProfits = 0, totalProfits = 0;

  for (const member of members) {
    const sm = snapMap[member._id.toString()];

    // النقاط الشخصية من snapshot
    const personalPoints = sm ? (sm.monthlyPoints || 0) : 0;
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = personalCommissionPoints * POINTS_TO_SHEKEL;

    // بناء شجرة الفريق من referredBy
    const genIds = await getGenIds(member._id);

    // نقاط كل جيل من snapshot (monthlyPoints - bonus خلال الفترة فقط)
    const genPoints = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const ids = genIds[i + 1] || [];
      genPoints[i] = getNetPointsFromSnap(ids, snapMap, bonusByMember);
    }

    // عمولة الفريق
    const teamCommissionPoints = genPoints.reduce((sum, pts, i) => sum + pts * TEAM_RATES[i], 0);
    const teamProfitInShekel = teamCommissionPoints * POINTS_TO_SHEKEL;

    // عمولة القيادة من snapshot
    const memberRankNumber = getRankNumber(member.memberRank);
    const rankInfo = getRankInfo(memberRankNumber);
    const leadershipRates = rankInfo?.leadershipCommission || {};
    const lRates = [
      leadershipRates.generation1 || 0,
      leadershipRates.generation2 || 0,
      leadershipRates.generation3 || 0,
      leadershipRates.generation4 || 0,
      leadershipRates.generation5 || 0
    ];
    const leadershipCommissionPoints = genPoints.reduce((sum, pts, i) => sum + pts * lRates[i], 0);
    const leadershipCommissionShekel = leadershipCommissionPoints * POINTS_TO_SHEKEL;

    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;
    const totalCommissionPoints = personalCommissionPoints + teamCommissionPoints;

    // عمولة شراء الزبون
    let customerPurchaseCommission = 0;
    const customerOrders = await Order.find({
      referredBy: member._id,
      isDelivered: true,
      deliveredAt: { $gte: period.startDate, $lte: endDateObj },
      isCustomerCommissionCalculated: { $ne: true }
    }).populate('user', 'role').populate('orderItems.product');

    for (const order of customerOrders) {
      if (order.user && order.user.role === 'customer') {
        for (const item of order.orderItems) {
          const cp = item.customerPriceAtPurchase || item.product?.customerPrice || 0;
          const sp = item.memberPriceAtPurchase || item.product?.subscriberPrice || 0;
          customerPurchaseCommission += (cp - sp) * item.quantity;
        }
      }
    }
    if (customerOrders.length > 0) {
      await Order.updateMany(
        { _id: { $in: customerOrders.map(o => o._id) } },
        { $set: { isCustomerCommissionCalculated: true } }
      );
    }

    const memberTotalProfit = performanceProfitInShekel + leadershipCommissionShekel + customerPurchaseCommission;
    const websiteDevelopmentCommission = memberTotalProfit > 100 ? memberTotalProfit * 0.03 : 0;
    const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

    if (finalProfit > 0 || personalPoints > 0) {
      console.log(`  ${member.name}: personal=${personalPoints} g1=${genPoints[0]} g2=${genPoints[1]} g3=${genPoints[2]} team=₪${teamProfitInShekel.toFixed(2)} total=₪${finalProfit}`);
    }

    membersProfits.push({
      memberId: member._id,
      memberName: member.name,
      username: member.username,
      subscriberCode: member.subscriberCode || '',
      memberRank: memberRankNumber,
      rankName: rankInfo.name,
      rankNameEn: rankInfo.nameEn,
      points: {
        personal: personalPoints,
        generation1: genPoints[0],
        generation2: genPoints[1],
        generation3: genPoints[2],
        generation4: genPoints[3],
        generation5: genPoints[4],
        total: personalPoints + totalCommissionPoints
      },
      commissions: {
        performance: { totalPoints: totalCommissionPoints, totalInShekel: performanceProfitInShekel },
        leadership: {
          totalCommissionPoints: leadershipCommissionPoints,
          commissionInShekel: leadershipCommissionShekel,
          hasLeadershipCommission: leadershipCommissionPoints > 0
        }
      },
      profit: {
        personalProfit: personalProfitInShekel,
        teamProfit: teamProfitInShekel,
        performanceProfit: performanceProfitInShekel,
        leadershipProfit: leadershipCommissionShekel,
        customerPurchaseCommission,
        totalProfitBeforeDeduction: memberTotalProfit,
        websiteDevelopmentCommission,
        totalProfit: finalProfit,
        conversionRate: POINTS_TO_SHEKEL
      }
    });

    totalPerformanceProfits += performanceProfitInShekel;
    totalLeadershipProfits += leadershipCommissionShekel;
    totalProfits += finalProfit;
  }

  // 4. حذف الدورة القديمة
  await ProfitPeriod.findByIdAndDelete(period._id);
  console.log(`🗑️ تم حذف الدورة القديمة`);

  // 5. إنشاء الدورة الجديدة
  const newPeriod = new ProfitPeriod({
    periodName: period.periodName,
    periodNumber: period.periodNumber,
    startDate: period.startDate,
    endDate: period.endDate,
    calculatedBy: period.calculatedBy,
    calculatedByName: period.calculatedByName,
    membersProfits,
    summary: {
      totalMembers: members.length,
      totalPerformanceProfits,
      totalLeadershipProfits,
      totalProfits,
      averageProfit: members.length > 0 ? totalProfits / members.length : 0
    },
    notes: 'محتسبة من النسخة الاحتياطية (snapshot) - كل النقاط',
    status: 'paid'
  });
  await newPeriod.save();
  console.log(`✅ تم إنشاء الدورة الجديدة | إجمالي الأرباح: ₪${totalProfits}`);

  // 6. تصفير النقاط
  await User.updateMany({ role: 'member' }, { $set: { monthlyPoints: 0, bonusPoints: 0 } });
  console.log(`✅ تم تصفير monthlyPoints و bonusPoints`);

  await mongoose.disconnect();
  console.log('🏁 Done');
}

run().catch(err => { console.error(err); process.exit(1); });
