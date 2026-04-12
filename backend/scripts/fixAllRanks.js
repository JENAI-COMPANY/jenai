require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { updateMemberRank } = require('../config/memberRanks');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const members = await User.find({ role: 'member' }).select('_id name username memberRank').lean();
  console.log(`👥 فحص ${members.length} عضو...`);

  let updated = 0;
  for (const m of members) {
    const result = await updateMemberRank(m._id, User);
    if (result.updated) {
      console.log(`⬆️  ${m.name} (${m.username}): ${result.oldRank} → ${result.newRank} | نقاط=${result.cumulativePoints} خطوط=${result.bronzeLines}`);
      updated++;
    }
  }

  console.log(`\n✅ تم تحديث ${updated} عضو من أصل ${members.length}`);
  await mongoose.disconnect();
}
run().catch(console.error);
