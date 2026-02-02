const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all members
    const members = await User.find({ role: 'member' })
      .select('name username sponsorId sponsorCode referredBy subscriberCode')
      .lean();

    console.log(`\n📊 Found ${members.length} members:\n`);

    for (const member of members) {
      console.log(`👤 ${member.name} (${member.username})`);
      console.log(`   - Subscriber Code: ${member.subscriberCode || 'N/A'}`);
      console.log(`   - Sponsor ID: ${member.sponsorId || 'N/A'}`);
      console.log(`   - Sponsor Code: ${member.sponsorCode || 'N/A'}`);
      console.log(`   - Referred By: ${member.referredBy || 'N/A'}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();
