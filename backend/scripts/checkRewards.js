const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai-network')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Reward = require('../models/Reward');
const User = require('../models/User');

async function checkRewards() {
  try {
    console.log('🔍 فحص سجل نقاط التعويض...\n');

    // البحث عن آخر نقاط تعويض
    const rewards = await Reward.find()
      .populate('user', 'name subscriberCode')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📋 آخر 10 عمليات تعويض:\n');

    for (const reward of rewards) {
      console.log(`🎁 ${reward.user.name} (${reward.user.subscriberCode})`);
      console.log(`   - المبلغ: ${reward.amount} نقطة`);
      console.log(`   - السبب: ${reward.reason || 'لا يوجد'}`);
      console.log(`   - تمت بواسطة: ${reward.addedBy.name}`);
      console.log(`   - التاريخ: ${reward.createdAt}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ تم الانتهاء');
    process.exit(0);
  }
}

checkRewards();
