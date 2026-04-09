// إعادة احتساب الأرباح باستخدام PT personal (نفس منطق calculatePeriodProfits الأصلي)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const PointsSnapshot = require('../models/PointsSnapshot');
const PointTransaction = require('../models/PointTransaction');
const Order = require('../models/Order');
const { calculateNetworkCommissions, getRankInfo, getRankNumber } = require('../config/memberRanks');

const POINTS_TO_SHEKEL = 0.55;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // جلب بيانات الدورة من الـ snapshot
  const snap = await PointsSnapshot.findOne({ periodName: /شهر 3/ });
  if (!snap) { console.log('❌ Snapshot not found'); process.exit(1); }

  const existingPeriod = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  const periodName = snap.periodName;
  const startDate = new Date('2026-03-13');
  const endDate = new Date('2026-04-09');
  const periodNumber = existingPeriod?.periodNumber || snap.periodNumber || 1;
  const calculatedBy = snap.takenBy;
  const calculatedByName = snap.takenByName;

  console.log(`📅 الدورة: ${periodName} | ${startDate.toISOString().slice(0,10)} → ${endDate.toISOString().slice(0,10)}`);

  // إعادة تأشير الطلبيات لإمكانية احتساب عمولة الزبائن
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);
  await Order.updateMany(
    { isDelivered: true, deliveredAt: { $gte: startDate, $lte: endDateObj }, isCustomerCommissionCalculated: true },
    { $set: { isCustomerCommissionCalculated: false } }
  );
  console.log('✅ تم إعادة تأشير الطلبيات');

  // جلب نقاط PT لكل عضو خلال الفترة
  const endDateObj2 = new Date(endDate);
  endDateObj2.setHours(23, 59, 59, 999);

  const pointsAgg = await PointTransaction.aggregate([
    { $match: { earnedAt: { $gte: startDate, $lte: endDateObj2 } } },
    { $group: { _id: { memberId: '$memberId', type: '$type' }, total: { $sum: '$points' } } }
  ]);

  const pointsMap = {};
  for (const t of pointsAgg) {
    const id = t._id.memberId.toString();
    if (!pointsMap[id]) pointsMap[id] = {};
    pointsMap[id][t._id.type] = (pointsMap[id][t._id.type] || 0) + t.total;
  }

  // جلب جميع الأعضاء
  const members = await User.find({ role: 'member' }).select('name username memberRank subscriberCode _id');
  console.log(`👥 ${members.length} عضو`);

  const membersProfits = [];
  let totalPerformanceProfits = 0, totalLeadershipProfits = 0, totalProfits = 0;

  for (const member of members) {
    const memberPoints = pointsMap[member._id.toString()] || {};

    // النقاط الشخصية: personal + bonus من PT خلال الفترة
    const personalPoints = (memberPoints['personal'] || 0) + (memberPoints['bonus'] || 0);
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = personalCommissionPoints * POINTS_TO_SHEKEL;

    // عمولات الشبكة من PT personal فقط
    const networkCommissions = await calculateNetworkCommissions(User, member._id, startDate, endDate);
    const teamCommissionPoints = networkCommissions.team.totalCommissionPoints;
    const teamProfitInShekel = networkCommissions.team.commissionInShekel;
    const leadershipCommission = networkCommissions.leadership;

    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;
    const totalCommissionPoints = personalCommissionPoints + teamCommissionPoints;

    const memberRankNumber = getRankNumber(member.memberRank);
    const rankInfo = getRankInfo(memberRankNumber);

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
      await Order.updateMany(
        { _id: { $in: customerOrders.map(o => o._id) } },
        { $set: { isCustomerCommissionCalculated: true } }
      );
    }

    const memberTotalProfit = performanceProfitInShekel + (leadershipCommission.commissionInShekel || 0) + customerPurchaseCommission;
    const websiteDevelopmentCommission = memberTotalProfit > 100 ? memberTotalProfit * 0.03 : 0;
    const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

    if (member.name && member.name.includes('البرقوني')) {
      console.log(`DEBUG البرقوني: personal=${personalPoints} g1=${networkCommissions.team.generation1} g2=${networkCommissions.team.generation2} g3=${networkCommissions.team.generation3} team=₪${teamProfitInShekel.toFixed(2)} total=₪${finalProfit}`);
    }

    if (finalProfit > 0 || personalPoints > 0) {
      console.log(`  ${member.name}: personal=${personalPoints} team=₪${teamProfitInShekel.toFixed(2)} total=₪${finalProfit}`);
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
        generation1: networkCommissions.team.generation1 || 0,
        generation2: networkCommissions.team.generation2 || 0,
        generation3: networkCommissions.team.generation3 || 0,
        generation4: networkCommissions.team.generation4 || 0,
        generation5: networkCommissions.team.generation5 || 0,
        total: personalPoints + totalCommissionPoints
      },
      commissions: {
        performance: { totalPoints: totalCommissionPoints, totalInShekel: performanceProfitInShekel },
        leadership: {
          totalCommissionPoints: leadershipCommission.totalCommissionPoints || 0,
          commissionInShekel: leadershipCommission.commissionInShekel || 0,
          hasLeadershipCommission: leadershipCommission.hasLeadershipCommission || false
        }
      },
      profit: {
        personalProfit: personalProfitInShekel,
        teamProfit: teamProfitInShekel,
        performanceProfit: performanceProfitInShekel,
        leadershipProfit: leadershipCommission.commissionInShekel || 0,
        customerPurchaseCommission,
        totalProfitBeforeDeduction: memberTotalProfit,
        websiteDevelopmentCommission,
        totalProfit: finalProfit,
        conversionRate: POINTS_TO_SHEKEL
      }
    });

    totalPerformanceProfits += performanceProfitInShekel;
    totalLeadershipProfits += (leadershipCommission.commissionInShekel || 0);
    totalProfits += finalProfit;
  }

  // حذف الدورة القديمة إن وجدت
  const old = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  if (old) { await ProfitPeriod.findByIdAndDelete(old._id); console.log('🗑️ تم حذف الدورة القديمة'); }

  // إنشاء الدورة الجديدة
  const newPeriod = new ProfitPeriod({
    periodName,
    periodNumber,
    startDate,
    endDate,
    calculatedBy,
    calculatedByName,
    membersProfits,
    summary: {
      totalMembers: members.length,
      totalPerformanceProfits,
      totalLeadershipProfits,
      totalProfits,
      averageProfit: members.length > 0 ? totalProfits / members.length : 0
    },
    notes: 'محتسبة من سجلات PT (personal) - نفس منطق الحسابة الأصلية',
    status: 'paid'
  });
  await newPeriod.save();
  console.log(`✅ تم إنشاء الدورة الجديدة | إجمالي الأرباح: ₪${totalProfits}`);

  await mongoose.disconnect();
  console.log('🏁 Done');
}

run().catch(err => { console.error(err); process.exit(1); });
