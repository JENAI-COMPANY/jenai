require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const startDate = new Date('2026-03-13');
  const endDate = new Date('2026-04-09T23:59:59.999Z');

  const barqouni = await User.findOne({ name: /البرقوني/ }).lean();
  const gen1 = await User.find({ sponsorCode: barqouni.subscriberCode, role: { $in: ['member', 'subscriber'] } })
    .select('_id name').lean();
  const gen1ids = gen1.map(m => m._id);

  // نقاط personal type فقط (الطريقة القديمة calculateNetworkCommissions)
  const ptPersonal = await PointTransaction.aggregate([
    { $match: { memberId: { $in: gen1ids }, type: 'personal', earnedAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$memberId', total: { $sum: '$points' } } }
  ]);
  const personalMap = {};
  ptPersonal.forEach(t => { personalMap[t._id.toString()] = t.total; });

  let totalPersonal = 0;
  console.log('الاسم | PT personal | PT personal+bonus');
  for (const m of gen1) {
    const id = m._id.toString();
    const pts = personalMap[id] || 0;
    if (pts > 0) { console.log(m.name + ' | ' + pts); }
    totalPersonal += pts;
  }
  console.log('---');
  console.log('مجموع PT personal لكل gen1:', totalPersonal);
  console.log('لو استخدمنا هاي: ' + totalPersonal + ' × 0.11 × 0.55 = ₪' + (totalPersonal * 0.11 * 0.55).toFixed(2));

  await mongoose.disconnect();
}
run().catch(console.error);
