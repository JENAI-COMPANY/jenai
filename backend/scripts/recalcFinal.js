// احتساب نهائي: personal من snapshot، gen1 من PT، gen2-5 من snapshot-bonus
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

async function getGenTree(subscriberCode) {
  const result = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  let currentCodes = [subscriberCode];
  for (let level = 1; level <= 5; level++) {
    if (currentCodes.length === 0) break;
    const lvl = await User.find({ sponsorCode: { $in: currentCodes }, role: { $in: ['member', 'subscriber'] } })
      .select('_id subscriberCode role monthlyPoints').lean();
    result[level] = lvl;
    currentCodes = lvl.map(m => m.subscriberCode).filter(Boolean);
  }
  return result;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const snap = await PointsSnapshot.findOne({ periodName: /شهر 3/ });
  const snapMap = {};
  snap.members.forEach(m => { snapMap[m.memberId.toString()] = m; });

  const startDate = new Date('2026-03-13');
  const endDate = new Date('2026-04-09');
  const endDateObj = new Date('2026-04-09T23:59:59.999Z');

  const existingPeriod = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  const periodName = snap.periodName;
  const periodNumber = existingPeriod?.periodNumber || snap.periodNumber || 1;

  // إعادة تأشير الطلبيات
  await Order.updateMany(
    { isDelivered: true, deliveredAt: { $gte: startDate, $lte: endDateObj }, isCustomerCommissionCalculated: true },
    { $set: { isCustomerCommissionCalculated: false } }
  );

  // نقاط البونص خلال الفترة (لكل الأعضاء)
  const bonusTxns = await PointTransaction.find({ type: 'bonus', earnedAt: { $gte: startDate, $lte: endDateObj } }).lean();
  const bonusByMember = {};
  bonusTxns.forEach(t => { bonusByMember[t.memberId.toString()] = (bonusByMember[t.memberId.toString()] || 0) + t.points; });

  // نقاط PT personal لكل الأعضاء خلال الفترة (للجيل الأول)
  const ptPersonalAgg = await PointTransaction.aggregate([
    { $match: { type: 'personal', earnedAt: { $gte: startDate, $lte: endDateObj } } },
    { $group: { _id: '$memberId', total: { $sum: '$points' } } }
  ]);
  const ptPersonalMap = {};
  ptPersonalAgg.forEach(t => { ptPersonalMap[t._id.toString()] = t.total; });

  const members = await User.find({ role: 'member' }).select('name username memberRank subscriberCode _id').lean();
  console.log(`👥 ${members.length} عضو`);

  const membersProfits = [];
  let totalPerformanceProfits = 0, totalLeadershipProfits = 0, totalProfits = 0;

  for (const member of members) {
    const sm = snapMap[member._id.toString()];

    // النقاط الشخصية من snapshot
    const personalPoints = sm ? (sm.monthlyPoints || 0) : 0;
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = personalCommissionPoints * POINTS_TO_SHEKEL;

    const genTree = await getGenTree(member.subscriberCode || '');
    const genPoints = [0, 0, 0, 0, 0];

    for (let i = 0; i < 5; i++) {
      const lvlMembers = genTree[i + 1] || [];
      for (const m of lvlMembers) {
        const id = m._id.toString();
        let monthlyPts;
        if (i === 0) {
          // الجيل الأول: من PT personal فقط (بدون نقاط ما قبل الفترة)
          monthlyPts = ptPersonalMap[id] || 0;
        } else {
          // الجيل 2-5: من snapshot - bonus
          const smm = snapMap[id];
          const raw = m.role === 'member' ? (smm?.monthlyPoints || 0) : (m.monthlyPoints || 0);
          const bonus = bonusByMember[id] || 0;
          monthlyPts = Math.max(0, raw - bonus);
        }
        genPoints[i] += monthlyPts;
      }
    }

    const teamCommissionPoints = genPoints.reduce((sum, pts, i) => sum + pts * TEAM_RATES[i], 0);
    const teamProfitInShekel = teamCommissionPoints * POINTS_TO_SHEKEL;

    // عمولة القيادة
    const memberRankNumber = getRankNumber(member.memberRank);
    const rankInfo = getRankInfo(memberRankNumber);
    const lRates = rankInfo?.leadershipCommission || {};
    const lGen = [lRates.generation1||0, lRates.generation2||0, lRates.generation3||0, lRates.generation4||0, lRates.generation5||0];
    const leadershipCommissionPoints = genPoints.reduce((sum, pts, i) => sum + pts * lGen[i], 0);
    const leadershipCommissionShekel = leadershipCommissionPoints * POINTS_TO_SHEKEL;

    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;
    const totalCommissionPoints = personalCommissionPoints + teamCommissionPoints;

    // عمولة شراء الزبون
    let customerPurchaseCommission = 0;
    const customerOrders = await Order.find({
      referredBy: member._id,
      isDelivered: true,
      deliveredAt: { $gte: startDate, $lte: endDateObj },
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
      await Order.updateMany({ _id: { $in: customerOrders.map(o => o._id) } }, { $set: { isCustomerCommissionCalculated: true } });
    }

    const memberTotalProfit = performanceProfitInShekel + leadershipCommissionShekel + customerPurchaseCommission;
    const websiteDevelopmentCommission = memberTotalProfit > 100 ? memberTotalProfit * 0.03 : 0;
    const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

    if (member.name && member.name.includes('البرقوني')) {
      console.log(`✅ البرقوني: personal=${personalPoints} g1=${genPoints[0]} g2=${genPoints[1]} g3=${genPoints[2]} g4=${genPoints[3]} g5=${genPoints[4]} team=₪${teamProfitInShekel.toFixed(2)} FINAL=₪${finalProfit}`);
    }

    if (finalProfit > 0 || personalPoints > 0) {
      console.log(`  ${member.name}: ₪${finalProfit}`);
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

  // حذف القديمة وإنشاء الجديدة
  const old = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  if (old) { await ProfitPeriod.findByIdAndDelete(old._id); console.log('🗑️ حذف الدورة القديمة'); }

  const newPeriod = new ProfitPeriod({
    periodName, periodNumber, startDate, endDate,
    calculatedBy: snap.takenBy,
    calculatedByName: snap.takenByName,
    membersProfits,
    summary: {
      totalMembers: members.length,
      totalPerformanceProfits,
      totalLeadershipProfits,
      totalProfits,
      averageProfit: members.length > 0 ? totalProfits / members.length : 0
    },
    notes: 'gen1=PT personal | gen2-5=snapshot-bonus | personal=snapshot',
    status: 'paid'
  });
  await newPeriod.save();
  console.log(`✅ تم إنشاء الدورة | إجمالي: ₪${totalProfits}`);
  await mongoose.disconnect();
  console.log('🏁 Done');
}

run().catch(err => { console.error(err); process.exit(1); });
