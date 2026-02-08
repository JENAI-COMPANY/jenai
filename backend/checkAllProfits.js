/**
 * سكريبت للتحقق من حساب الأرباح الكاملة لجميع الأعضاء
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const { calculateLeadershipCommission, getRankNumber, getRankInfo } = require('./config/memberRanks');
require('dotenv').config();

const POINTS_TO_SHEKEL = 0.55;

const checkAllProfits = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const members = await User.find({
      username: { $in: ['kk', 'jkjk', 'ggg', 'ghgh'] }
    }).select('name username monthlyPoints generation1Points generation2Points generation3Points memberRank');

    console.log('📊 حساب الأرباح الكاملة:\n');
    console.log('='.repeat(80) + '\n');

    for (const member of members) {
      const personalPoints = member.monthlyPoints || 0;
      const gen1Points = member.generation1Points || 0;
      const gen2Points = member.generation2Points || 0;
      const gen3Points = member.generation3Points || 0;
      const teamPoints = gen1Points + gen2Points + gen3Points;

      // حساب أرباح الأداء
      const personalCommPoints = personalPoints * 0.20;
      const personalProfit = Math.floor(personalCommPoints * POINTS_TO_SHEKEL);
      const teamProfit = Math.floor(teamPoints * POINTS_TO_SHEKEL);
      const performanceProfit = personalProfit + teamProfit;

      // حساب عمولة القيادة
      const leadershipComm = await calculateLeadershipCommission(User, member._id);
      const leadershipProfit = leadershipComm.commissionInShekel || 0;

      // الإجمالي
      const totalProfit = performanceProfit + leadershipProfit;

      const rankNumber = getRankNumber(member.memberRank);
      const rankInfo = getRankInfo(rankNumber);

      console.log(`👤 ${member.name} (@${member.username}) - ${rankInfo.name}`);
      console.log(`   النقاط:`);
      console.log(`     شخصي: ${personalPoints}`);
      console.log(`     فريق: ${teamPoints} (Gen1: ${gen1Points}, Gen2: ${gen2Points}, Gen3: ${gen3Points})`);
      console.log(`   الأرباح:`);
      console.log(`     أداء شخصي: ${personalPoints} × 20% × 0.55 = ${personalProfit} ₪`);
      console.log(`     أداء فريق: ${teamPoints} × 0.55 = ${teamProfit} ₪`);
      console.log(`     عمولة قيادة: ${leadershipProfit} ₪`);
      console.log(`   🎯 الإجمالي: ${totalProfit} ₪`);

      if (leadershipComm.breakdown && leadershipComm.breakdown.length > 0) {
        console.log(`   تفاصيل عمولة القيادة:`);
        leadershipComm.breakdown.forEach(b => {
          console.log(`     Gen${b.generation}: ${b.generationPoints} pts × ${b.commissionRatePercent} = ${b.commissionInShekel} ₪`);
        });
      }
      console.log('');
    }

    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAllProfits();
