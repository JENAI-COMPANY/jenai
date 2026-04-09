require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointsSnapshot = require('../models/PointsSnapshot');
const PointTransaction = require('../models/PointTransaction');
const Order = require('../models/Order');
const { getRankInfo, getRankNumber } = require('../config/memberRanks');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const snap = await PointsSnapshot.findOne({ periodName: /شهر 3/ });
  const snapMap = {};
  snap.members.forEach(m => { snapMap[m.memberId.toString()] = m; });

  const startDate = new Date('2026-03-13');
  const endDate = new Date('2026-04-09T23:59:59.999Z');

  const bonusTxns = await PointTransaction.find({ type: 'bonus', earnedAt: { $gte: startDate, $lte: endDate } }).lean();
  const bonusByMember = {};
  bonusTxns.forEach(t => { bonusByMember[t.memberId.toString()] = (bonusByMember[t.memberId.toString()] || 0) + t.points; });

  const barqouni = await User.findOne({ name: /البرقوني/ }).lean();
  const bId = barqouni._id.toString();
  const sm = snapMap[bId];

  const personal = sm ? (sm.monthlyPoints || 0) : 0;
  const ownBonus = bonusByMember[bId] || 0;
  console.log('=== مصطفى البرقوني ===');
  console.log('personal monthlyPoints:', personal, '| own bonus:', ownBonus);
  console.log('rank:', barqouni.memberRank);

  const RATES = [0.11, 0.08, 0.06, 0.03, 0.02];
  let currentCodes = [barqouni.subscriberCode];
  let totalTeamCommPts = 0;
  const genTotals = [];

  for (let i = 0; i < 5; i++) {
    if (currentCodes.length === 0) break;
    const lvl = await User.find({ sponsorCode: { $in: currentCodes }, role: { $in: ['member', 'subscriber'] } })
      .select('_id name role monthlyPoints subscriberCode').lean();

    let genTotal = 0;
    for (const m of lvl) {
      const id = m._id.toString();
      const smm = snapMap[id];
      const monthly = m.role === 'member' ? (smm?.monthlyPoints || 0) : (m.monthlyPoints || 0);
      const bonus = bonusByMember[id] || 0;
      const net = Math.max(0, monthly - bonus);
      genTotal += net;
    }
    genTotals.push(genTotal);
    totalTeamCommPts += genTotal * RATES[i];
    console.log('gen' + (i + 1) + ': count=' + lvl.length + ' net_pts=' + genTotal + ' comm_pts=' + (genTotal * RATES[i]).toFixed(2));
    currentCodes = lvl.map(m => m.subscriberCode).filter(Boolean);
  }

  const CONV = 0.55;
  const personalProfit = personal * 0.20 * CONV;
  const teamProfit = totalTeamCommPts * CONV;

  const rankNum = getRankNumber(barqouni.memberRank);
  const rankInfo = getRankInfo(rankNum);
  const lRates = rankInfo.leadershipCommission || {};
  const lGen = [lRates.generation1 || 0, lRates.generation2 || 0, lRates.generation3 || 0, lRates.generation4 || 0, lRates.generation5 || 0];
  let leadershipPts = 0;
  for (let i = 0; i < 5; i++) leadershipPts += (genTotals[i] || 0) * lGen[i];
  const leadershipProfit = leadershipPts * CONV;

  let custComm = 0;
  const custOrders = await Order.find({
    referredBy: barqouni._id,
    isDelivered: true,
    deliveredAt: { $gte: startDate, $lte: endDate },
    isCustomerCommissionCalculated: { $ne: true }
  }).populate('user', 'role').populate('orderItems.product');

  for (const ord of custOrders) {
    if (ord.user?.role === 'customer') {
      for (const item of ord.orderItems) {
        const cp = item.customerPriceAtPurchase || item.product?.customerPrice || 0;
        const sp = item.memberPriceAtPurchase || item.product?.subscriberPrice || 0;
        custComm += (cp - sp) * item.quantity;
      }
    }
  }

  const total = personalProfit + teamProfit + leadershipProfit + custComm;
  const webDeduct = total > 100 ? total * 0.03 : 0;
  const final = Math.floor(total - webDeduct);

  console.log('---');
  console.log('personalProfit:', personalProfit.toFixed(2));
  console.log('teamProfit:', teamProfit.toFixed(2));
  console.log('leadershipProfit:', leadershipProfit.toFixed(2));
  console.log('customerCommission:', custComm.toFixed(2));
  console.log('total before deduction:', total.toFixed(2));
  console.log('website 3% deduction:', webDeduct.toFixed(2));
  console.log('FINAL PROFIT: ₪' + final);

  await mongoose.disconnect();
}
run().catch(console.error);
