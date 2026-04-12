require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const members = await User.find({ role: 'member' }).lean();
  let fixed = 0;

  for (const m of members) {
    const rounded = Math.round(m.points || 0);
    if (m.points !== rounded) {
      await User.updateOne({ _id: m._id }, { $set: { points: rounded } });
      console.log(`${m.name}: ${m.points} → ${rounded}`);
      fixed++;
    }
  }

  console.log(`✅ تم إصلاح ${fixed} عضو`);
  await mongoose.disconnect();
}
run().catch(console.error);
