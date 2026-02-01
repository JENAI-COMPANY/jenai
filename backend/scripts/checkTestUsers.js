const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const User = require('../models/User');

async function checkTestUsers() {
  try {
    console.log('\n🔍 Checking test users...\n');

    // Get all test users
    const testUsers = await User.find({
      username: { $regex: /_test/ }
    })
      .select('name username subscriberCode sponsorCode points')
      .sort({ username: 1 })
      .lean();

    console.log(`Found ${testUsers.length} test users:\n`);

    testUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (@${user.username})`);
      console.log(`   subscriberCode: ${user.subscriberCode || 'NOT SET'}`);
      console.log(`   sponsorCode: ${user.sponsorCode || 'NOT SET'}`);
      console.log(`   points: ${user.points || 0}`);
      console.log('');
    });

    // Check Level 1 users specifically
    console.log('\n📊 Level 1 users (should have sponsorCode = LD103474):');
    const level1 = testUsers.filter(u => u.username.includes('_test1'));
    level1.forEach(u => {
      console.log(`   - ${u.name}: sponsorCode = "${u.sponsorCode}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTestUsers();
