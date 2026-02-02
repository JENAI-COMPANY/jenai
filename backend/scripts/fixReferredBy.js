const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const fixReferredBy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users who have sponsorId but no referredBy
    const usersToFix = await User.find({
      sponsorId: { $exists: true, $ne: null },
      $or: [
        { referredBy: { $exists: false } },
        { referredBy: null }
      ]
    });

    console.log(`📊 Found ${usersToFix.length} users to fix`);

    let fixed = 0;
    for (const user of usersToFix) {
      user.referredBy = user.sponsorId;
      await user.save();
      console.log(`✅ Fixed ${user.name} (${user.username}) - referredBy set to sponsor ${user.sponsorId}`);
      fixed++;
    }

    console.log(`\n🎉 Successfully fixed ${fixed} users!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixReferredBy();
