const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const User = require('../models/User');

async function createSubscriber() {
  try {
    console.log('Creating subscriber account...\n');

    // Check if subscriber already exists
    const existingUser = await User.findOne({ username: 'subscriber1' });
    if (existingUser) {
      console.log('Subscriber account already exists!');
      console.log('Username:', existingUser.username);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      process.exit(0);
    }

    // Generate subscriber code
    const subscriberCode = await User.generateSubscriberCode('SA', 'Riyadh');

    // Create subscriber account
    const subscriber = await User.create({
      username: 'subscriber1',
      name: 'Subscriber User',
      email: 'subscriber@example.com',
      password: 'subscriber123',
      role: 'subscriber',
      phone: '+966501234567',
      country: 'SA',
      city: 'Riyadh',
      region: 'Riyadh',
      subscriberCode: subscriberCode,
      points: 100,
      monthlyPoints: 50,
      commissionRate: 10,
      rank: 'Silver'
    });

    console.log('✅ Subscriber account created successfully!\n');
    console.log('Account Details:');
    console.log('================');
    console.log('Username:', subscriber.username);
    console.log('Password: subscriber123');
    console.log('Email:', subscriber.email);
    console.log('Role:', subscriber.role);
    console.log('Subscriber Code:', subscriber.subscriberCode);
    console.log('Region:', subscriber.region);
    console.log('Points:', subscriber.points);
    console.log('Rank:', subscriber.rank);

    process.exit(0);
  } catch (error) {
    console.error('Error creating subscriber:', error);
    process.exit(1);
  }
}

createSubscriber();
