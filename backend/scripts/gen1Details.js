require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointsSnapshot = require('../models/PointsSnapshot');
const PointTransaction = require('../models/PointTransaction');

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
  const gen1 = await User.find({ sponsorCode: barqouni.subscriberCode, role: { $in: ['member', 'subscriber'] } })
    .select('_id name role monthlyPoints').lean();

  console.log('الاسم | الشهري | البونص | الصافي');
  console.log('---');
  let totalMonthly = 0, totalBonus = 0, totalNet = 0;
  for (const m of gen1) {
    const id = m._id.toString();
    const smm = snapMap[id];
    const monthly = m.role === 'member' ? (smm?.monthlyPoints || 0) : (m.monthlyPoints || 0);
    const bonus = bonusByMember[id] || 0;
    const net = Math.max(0, monthly - bonus);
    totalMonthly += monthly;
    totalBonus += bonus;
    totalNet += net;
    if (monthly > 0 || bonus > 0)
      console.log(m.name + ' | ' + monthly + ' | ' + bonus + ' | ' + net);
  }
  console.log('---');
  console.log('المجموع | ' + totalMonthly + ' | ' + totalBonus + ' | ' + totalNet);

  await mongoose.disconnect();
}
run().catch(console.error);
