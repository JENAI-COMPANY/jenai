/**
 * سكريبت للتحقق من نقاط الفريق للأعضاء
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const members = await User.find({
      username: { $in: ['kk', 'jkjk', 'ggg', 'ghgh'] }
    }).select('name username monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points referredBy');

    for (const member of members) {
      console.log(`👤 ${member.name} (@${member.username})`);
      console.log(`   monthlyPoints: ${member.monthlyPoints || 0}`);
      console.log(`   generation1Points: ${member.generation1Points || 0}`);
      console.log(`   generation2Points: ${member.generation2Points || 0}`);
      console.log(`   generation3Points: ${member.generation3Points || 0}`);
      console.log(`   generation4Points: ${member.generation4Points || 0}`);
      console.log(`   generation5Points: ${member.generation5Points || 0}`);
      console.log(`   referredBy: ${member.referredBy || 'none'}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkMembers();
