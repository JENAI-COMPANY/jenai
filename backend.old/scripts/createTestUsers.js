const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected...');

    // Create a Network Subscriber (with referral capability)
    const subscriberExists = await User.findOne({ username: 'subscriber1' });
    if (!subscriberExists) {
      const subscriber = await User.create({
        username: 'subscriber1',
        name: 'John Subscriber',
        email: 'subscriber@test.com',
        password: 'password123',
        role: 'subscriber',
        phone: '+1234567891',
        country: 'Egypt',
        city: 'Cairo'
      });
      console.log('✅ Network Subscriber created successfully!');
      console.log('   Username: subscriber1');
      console.log('   Password: password123');
      console.log('   Referral Code:', subscriber._id);
    } else {
      console.log('⚠️  Network Subscriber already exists');
      console.log('   Username: subscriber1');
      console.log('   Password: password123');
      console.log('   Referral Code:', subscriberExists._id);
    }

    console.log('');

    // Create a Regular Customer
    const customerExists = await User.findOne({ username: 'customer1' });
    if (!customerExists) {
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
    } else {
      console.log('⚠️  Regular Customer already exists');
      console.log('   Username: customer1');
      console.log('   Password: password123');
    }

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

createTestUsers();
