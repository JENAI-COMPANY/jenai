const mongoose = require('mongoose');
const User = require('./models/User');

const fixReferredBy = async () => {
  try {
    await mongoose.connect('mongodb://104.218.48.119:27017/jenai_db');
    console.log('🔧 Fixing referredBy for existing users...\n');

    // Find users with sponsorId but no referredBy
    const usersToFix = await User.find({
      sponsorId: { $ne: null },
      $or: [
        { referredBy: null },
        { referredBy: { $exists: false }}
      ]
    }).select('name username sponsorId referredBy');

    console.log(`Found ${usersToFix.length} users to fix:\n`);

    for (const user of usersToFix) {
      console.log(`  - ${user.name} (@${user.username})`);
      console.log(`    Before: sponsorId=${user.sponsorId}, referredBy=${user.referredBy}`);

      user.referredBy = user.sponsorId;
      await user.save();

      console.log(`    After: sponsorId=${user.sponsorId}, referredBy=${user.referredBy}`);
      console.log(`    ✅ Fixed!\n`);
    }

    console.log(`\n✅ Successfully fixed ${usersToFix.length} users!`);

    // Verify
    console.log('\n🔍 Verification:');
    const stillBroken = await User.countDocuments({
      sponsorId: { $ne: null },
      $or: [
        { referredBy: null },
        { referredBy: { $exists: false }}
      ]
    });
    console.log(`Users still missing referredBy: ${stillBroken}`);

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
};

fixReferredBy();
