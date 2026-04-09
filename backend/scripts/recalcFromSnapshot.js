// سكريبت إعادة احتساب الأرباح من النسخة الاحتياطية
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ProfitPeriod = require('../models/ProfitPeriod');
const PointsSnapshot = require('../models/PointsSnapshot');
const Order = require('../models/Order');
const { calculateNetworkCommissions, getRankInfo, getRankNumber } = require('../config/memberRanks');

const POINTS_TO_SHEKEL = 0.55;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // 1. جلب الدورة الحالية
  const period = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  if (!period) { console.log('❌ Period not found'); process.exit(1); }
  console.log(`📅 الدورة: ${period.periodName} | ${period.startDate.toISOString().slice(0,10)} → ${period.endDate.toISOString().slice(0,10)}`);

  // 2. جلب النسخة الاحتياطية
  const snap = await PointsSnapshot.findOne({ periodName: period.periodName });
  if (!snap) { console.log('❌ Snapshot not found'); process.exit(1); }
  console.log(`📦 Snapshot: ${snap.members.length} عضو`);

  // بناء map من snapshot
  const snapMap = {};
  snap.members.forEach(m => { snapMap[m.memberId.toString()] = m; });

  // 3. جلب جميع الأعضاء
  const members = await User.find({ role: 'member' }).select('name username memberRank subscriberCode');
  console.log(`👥 ${members.length} عضو`);

  const startDate = period.startDate;
  const endDate = period.endDate;
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);

  const membersProfits = [];
  let totalPerformanceProfits = 0, totalLeadershipProfits = 0, totalProfits = 0;

  for (const member of members) {
    const sm = snapMap[member._id.toString()];
    // النقاط الشخصية من الـ snapshot مباشرة
    const personalPoints = sm ? (sm.monthlyPoints || 0) : 0;

    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = personalCommissionPoints * POINTS_TO_SHEKEL;

    // عمولات الفريق من PT (نفس الطريقة القديمة)
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
          let actualCustomerPrice = item.customerPriceAtPurchase || (item.product?.customerPrice) || 0;
          let actualSubscriberPrice = item.memberPriceAtPurchase || (item.product?.subscriberPrice) || 0;
          customerPurchaseCommission += (actualCustomerPrice - actualSubscriberPrice) * item.quantity;
        }
      }
    }

    if (customerOrders.length > 0) {
      await Order.updateMany(
        { _id: { $in: customerOrders.map(o => o._id) } },
        { $set: { isCustomerCommissionCalculated: true } }
      );
    }

    const memberTotalProfit = performanceProfitInShekel + leadershipCommission.commissionInShekel + customerPurchaseCommission;
    const websiteDevelopmentCommission = memberTotalProfit > 100 ? memberTotalProfit * 0.03 : 0;
    const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);

    if (finalProfit > 0 || personalPoints > 0) {
      console.log(`  ${member.name}: personal=${personalPoints} → ₪${personalProfitInShekel.toFixed(2)}, team=₪${teamProfitInShekel.toFixed(2)}, total=₪${finalProfit}`);
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
        generation1: networkCommissions.team.generation1,
        generation2: networkCommissions.team.generation2,
        generation3: networkCommissions.team.generation3,
        generation4: networkCommissions.team.generation4,
        generation5: networkCommissions.team.generation5,
        total: personalPoints + teamCommissionPoints
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

  // 4. حذف الدورة القديمة
  await ProfitPeriod.findByIdAndDelete(period._id);
  console.log(`🗑️ تم حذف الدورة القديمة`);

  // 5. إنشاء الدورة الجديدة بنفس الاسم والتواريخ
  const newPeriod = new ProfitPeriod({
    periodName: period.periodName,
    periodNumber: period.periodNumber,
    startDate: period.startDate,
    endDate: period.endDate,
    calculatedBy: period.calculatedBy,
    calculatedByName: period.calculatedByName + ' (من snapshot)',
    membersProfits,
    summary: {
      totalMembers: members.length,
      totalPerformanceProfits,
      totalLeadershipProfits,
      totalProfits,
      averageProfit: members.length > 0 ? totalProfits / members.length : 0
    },
    notes: 'محتسبة من النسخة الاحتياطية (snapshot)',
    status: 'paid'
  });
  await newPeriod.save();
  console.log(`✅ تم إنشاء الدورة الجديدة | إجمالي الأرباح: ₪${totalProfits}`);

  // 6. تصفير monthlyPoints لكل الأعضاء
  await User.updateMany({ role: 'member' }, { $set: { monthlyPoints: 0, bonusPoints: 0 } });
  console.log(`✅ تم تصفير monthlyPoints و bonusPoints لكل الأعضاء`);

  await mongoose.disconnect();
  console.log('🏁 Done');
}

run().catch(err => { console.error(err); process.exit(1); });
