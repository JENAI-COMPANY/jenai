require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointsSnapshot = require('../models/PointsSnapshot');
const PointTransaction = require('../models/PointTransaction');

const POINTS_TO_SHEKEL = 0.55;

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
  const sm = snapMap[barqouni._id.toString()];
  const personalPoints = sm ? (sm.monthlyPoints || 0) : 0;
  const ownBonus = bonusByMember[barqouni._id.toString()] || 0;
  console.log('personal monthlyPoints (snapshot):', personalPoints);
  console.log('personal bonus (his own) in period:', ownBonus);

  // بناء شجرة gen1
  const gen1 = await User.find({ sponsorCode: barqouni.subscriberCode, role: { $in: ['member','subscriber'] } })
    .select('_id name role monthlyPoints subscriberCode').lean();

  let g1WithBonus = 0, g1WithoutBonus = 0;
  console.log('\n--- gen1 members with points ---');
  for (const m of gen1) {
    const id = m._id.toString();
    const smm = snapMap[id];
    const monthly = m.role === 'member' ? (smm?.monthlyPoints || 0) : (m.monthlyPoints || 0);
    const bonus = bonusByMember[id] || 0;
    const net = Math.max(0, monthly - bonus);
    if (monthly > 0) console.log('  ' + m.name + ': monthly=' + monthly + ' bonus=' + bonus + ' net=' + net);
    g1WithBonus += net;
    g1WithoutBonus += monthly;
  }
  console.log('\ng1 WITH bonus deduction:', g1WithBonus);
  console.log('g1 WITHOUT bonus deduction:', g1WithoutBonus);

  // حساب الأرباح الشخصية
  const personalProfit = personalPoints * 0.20 * POINTS_TO_SHEKEL;
  const personalProfitNoBonusSelf = (personalPoints - ownBonus) * 0.20 * POINTS_TO_SHEKEL;

  console.log('\n--- Scenarios ---');
  console.log('personalProfit (full monthlyPoints):', personalProfit.toFixed(2));
  console.log('personalProfit (monthlyPoints - own bonus):', personalProfitNoBonusSelf.toFixed(2));
  console.log('NOTE: g2,g3,g4,g5 not included below - just g1 for comparison');
  console.log('g1 contribution WITH deduction:', (g1WithBonus * 0.11 * POINTS_TO_SHEKEL).toFixed(2));
  console.log('g1 contribution WITHOUT deduction:', (g1WithoutBonus * 0.11 * POINTS_TO_SHEKEL).toFixed(2));

  await mongoose.disconnect();
}
run().catch(console.error);
