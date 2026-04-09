require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const barqouni = await User.findOne({ name: /البرقوني/ }).lean();

  const txns = await PointTransaction.find({
    memberId: barqouni._id,
    type: { $in: ['generation1', 'generation2', 'generation3', 'generation4', 'generation5'] },
    earnedAt: { $gte: new Date('2026-03-13'), $lte: new Date('2026-04-09T23:59:59') }
  }).lean();

  const byType = {};
  txns.forEach(t => {
    if (!byType[t.type]) byType[t.type] = 0;
    byType[t.type] += t.points;
  });

  console.log('=== نقاط الأجيال في PT خلال الفترة ===');
  for (const [type, pts] of Object.entries(byType)) {
    const rate = { generation1: 0.11, generation2: 0.08, generation3: 0.06, generation4: 0.03, generation5: 0.02 }[type];
    console.log(type + ': ' + pts.toFixed(2) + ' pts (= ' + (pts / rate).toFixed(0) + ' raw / rate ' + rate + ')');
  }

  // إجمالي gen1 PT
  const gen1total = byType['generation1'] || 0;
  console.log('\ngen1 PT total:', gen1total.toFixed(2));
  console.log('gen1 raw points (÷0.11):', (gen1total / 0.11).toFixed(0));

  await mongoose.disconnect();
}
run().catch(console.error);
