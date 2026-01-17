const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const User = require('../models/User');

async function assignRegions() {
  try {
    console.log('Assigning regions to users...\n');

    // Assign region to regional admin
    const regionalAdmin = await User.findOne({ username: 'regionaladmin' });
    if (regionalAdmin) {
      regionalAdmin.region = 'Riyadh';
      await regionalAdmin.save();
      console.log('✓ Assigned region "Riyadh" to regional admin');
    }

    // Assign regions to first 3 users (same as regional admin's region)
    const users = await User.find({ role: { $in: ['customer', 'subscriber'] } }).limit(3);

    for (let i = 0; i < users.length; i++) {
      users[i].region = 'Riyadh';
      await users[i].save();
      console.log(`✓ Assigned region "Riyadh" to user: ${users[i].username || users[i].email}`);
    }

    console.log('\n✅ Region assignment complete!');
    console.log('Regional admin and test users are now in the "Riyadh" region.');
    console.log('Orders from these users should now be visible to the regional admin.');

    process.exit(0);
  } catch (error) {
    console.error('Error assigning regions:', error);
    process.exit(1);
  }
}

assignRegions();
