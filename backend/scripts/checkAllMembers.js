const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const checkMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const members = ['ghgh', 'ggg', 'jkjk', 'kk'];

    for (const username of members) {
      const user = await User.findOne({ username });
      if (user) {
        console.log(`👤 ${user.name} (${user.username})`);
        console.log(`   - Monthly Points: ${user.monthlyPoints || 0}`);
        console.log(`   - Generation 1: ${user.generation1Points || 0}`);
        console.log(`   - Generation 2: ${user.generation2Points || 0}`);
        console.log(`   - Generation 3: ${user.generation3Points || 0}`);
        console.log(`   - Total: ${(user.monthlyPoints || 0) + (user.generation1Points || 0) + (user.generation2Points || 0) + (user.generation3Points || 0)}`);
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkMembers();
