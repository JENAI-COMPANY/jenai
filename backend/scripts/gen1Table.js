require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const PointsSnapshot = require('../models/PointsSnapshot');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const startDate = new Date('2026-03-13');
  const endDate = new Date('2026-04-09T23:59:59.999Z');

  const snap = await PointsSnapshot.findOne({ periodName: /شهر 3/ });
  const snapMap = {};
  snap.members.forEach(m => { snapMap[m.memberId.toString()] = m; });

  const barqouni = await User.findOne({ name: /البرقوني/ }).lean();
  const gen1 = await User.find({ sponsorCode: barqouni.subscriberCode, role: { $in: ['member', 'subscriber'] } })
    .select('_id name role monthlyPoints').lean();
  const gen1ids = gen1.map(m => m._id);

  // PT personal فقط خلال الفترة
  const ptAgg = await PointTransaction.aggregate([
    { $match: { memberId: { $in: gen1ids }, type: 'personal', earnedAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$memberId', total: { $sum: '$points' } } }
  ]);
  const ptMap = {};
  ptAgg.forEach(t => { ptMap[t._id.toString()] = t.total; });

  // PT bonus خلال الفترة
  const bonusAgg = await PointTransaction.aggregate([
    { $match: { memberId: { $in: gen1ids }, type: 'bonus', earnedAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$memberId', total: { $sum: '$points' } } }
  ]);
  const bonusMap = {};
  bonusAgg.forEach(t => { bonusMap[t._id.toString()] = t.total; });

  let totalSnap = 0, totalBonus = 0, totalPT = 0;
  const rows = [];
  for (const m of gen1) {
    const id = m._id.toString();
    const smm = snapMap[id];
    const snapPts = m.role === 'member' ? (smm?.monthlyPoints || 0) : (m.monthlyPoints || 0);
    const bonus = bonusMap[id] || 0;
    const pt = ptMap[id] || 0;
    if (snapPts > 0 || pt > 0 || bonus > 0) {
      rows.push({ name: m.name, snap: snapPts, bonus, net: Math.max(0, snapPts - bonus), pt });
    }
    totalSnap += snapPts;
    totalBonus += bonus;
    totalPT += pt;
  }

  console.log('الاسم | snapshot | بونص | صافي(snap-bonus) | PT personal');
  console.log('---');
  rows.forEach(r => console.log(r.name + ' | ' + r.snap + ' | ' + r.bonus + ' | ' + r.net + ' | ' + r.pt));
  console.log('---');
  console.log('المجموع | ' + totalSnap + ' | ' + totalBonus + ' | ' + Math.max(0, totalSnap - totalBonus) + ' | ' + totalPT);

  await mongoose.disconnect();
}
run().catch(console.error);
