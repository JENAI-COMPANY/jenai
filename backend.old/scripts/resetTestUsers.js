const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const resetTestUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected...');

    // Delete existing test users
    await User.deleteOne({ username: 'subscriber1' });
    await User.deleteOne({ username: 'customer1' });
    console.log('Deleted old test users...');

    // Create a Network Subscriber (with referral capability)
    const subscriber = await User.create({
      username: 'subscriber1',
      name: 'John Subscriber',
      email: 'subscriber@test.com',
      password: 'password123',
      role: 'subscriber',
      phone: '+1234567891',
      country: 'Egypt',
      city: 'Cairo',
      subscriberId: 'SUB' + Date.now(),
      subscriberCode: 'EC' + Math.floor(100000 + Math.random() * 900000),
      commissionRate: 10
    });

    console.log('✅ Network Subscriber created successfully!');
    console.log('   Username: subscriber1');
    console.log('   Password: password123');
    console.log('   Subscriber ID:', subscriber.subscriberId);
    console.log('   Subscriber Code:', subscriber.subscriberCode);
    console.log('   Referral Code (use this for registration):', subscriber._id);

    console.log('');

    // Create a Regular Customer
    await User.create({
      username: 'customer1',
      name: 'Jane Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      phone: '+1234567892'
    });

    console.log('✅ Regular Customer created successfully!');
    console.log('   Username: customer1');
    console.log('   Password: password123');

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('All test users are ready to use!');
    console.log('═══════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

resetTestUsers();
