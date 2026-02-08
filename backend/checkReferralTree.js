/**
 * سكريبت للتحقق من شجرة الإحالة
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkTree = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const members = await User.find({
      username: { $in: ['kk', 'jkjk', 'ggg', 'ghgh'] }
    }).select('_id name username referredBy').populate('referredBy', 'name username');

    console.log('📊 Referral Tree:\n');

    for (const member of members) {
      const sponsor = member.referredBy;
      console.log(`${member.name} (@${member.username})`);
      console.log(`  └─ Referred by: ${sponsor ? `${sponsor.name} (@${sponsor.username})` : 'NONE'}`);
      console.log(`  └─ ID: ${member._id}\n`);
    }

    // Find downline for each
    console.log('\n📊 Downline for each member:\n');
    for (const member of members) {
      const downline = await User.find({ referredBy: member._id }).select('name username');
      console.log(`${member.name} (@${member.username}) downline:`);
      if (downline.length === 0) {
        console.log(`  └─ No direct referrals\n`);
      } else {
        downline.forEach(d => console.log(`  └─ ${d.name} (@${d.username})`));
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTree();
