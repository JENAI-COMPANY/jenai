const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Order = require('../models/Order');

// نسخة من دالة distributeCommissions
const distributeCommissions = async (buyer, productPoints) => {
  try {
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];
    const LEADERSHIP_RATES = {
      'agent': [],
      'bronze': [0.05],
      'gold': [0.05, 0.04],
      'silver': [0.05, 0.04, 0.03],
      'ruby': [0.05, 0.04, 0.03, 0.02],
      'diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
      'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
    };
    const POINTS_TO_CURRENCY = 0.55;

    let currentMemberId = buyer.referredBy;
    let generationLevel = 0;

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') break;

      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = productPoints * genRate;

      const leadershipRates = LEADERSHIP_RATES[currentMember.memberRank] || [];
      const leadershipRate = leadershipRates[generationLevel] || 0;
      const leadershipPoints = productPoints * leadershipRate;

      const totalPoints = genPoints + leadershipPoints;
      const profit = totalPoints * POINTS_TO_CURRENCY;

      const genFieldName = `generation${generationLevel + 1}Points`;
      currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;

      if (leadershipPoints > 0) {
        currentMember.leadershipPoints = (currentMember.leadershipPoints || 0) + leadershipPoints;
      }

      currentMember.totalCommission = Math.floor((currentMember.totalCommission || 0) + profit);
      currentMember.availableCommission = Math.floor((currentMember.availableCommission || 0) + profit);

      await currentMember.save();

      console.log(`   💰 ${currentMember.name} (جيل ${generationLevel + 1}) - نقاط أجيال: ${genPoints.toFixed(2)}, نقاط قيادة: ${leadershipPoints.toFixed(2)}, ربح: ${profit} شيكل`);

      currentMemberId = currentMember.referredBy;
      generationLevel++;
    }
  } catch (error) {
    console.error('❌ خطأ في توزيع العمولات:', error);
  }
};

const redistributePoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all received orders
    const orders = await Order.find({ status: 'received' }).populate('user');

    console.log(`📊 Found ${orders.length} received orders\n`);

    for (const order of orders) {
      if (!order.user || !order.totalPoints) continue;

      console.log(`\n📦 Processing order ${order.orderNumber}`);
      console.log(`   - User: ${order.user.name}`);
      console.log(`   - Points: ${order.totalPoints}`);

      // Distribute commissions to upline
      await distributeCommissions(order.user, order.totalPoints);
    }

    console.log('\n\n🎉 Successfully redistributed points!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

redistributePoints();
