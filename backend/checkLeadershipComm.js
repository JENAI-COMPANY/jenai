/**
 * سكريبت للتحقق من عمولة القيادة
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const { calculateLeadershipCommission, getRankNumber, getRankInfo } = require('./config/memberRanks');
require('dotenv').config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const ghgh = await User.findOne({ username: 'ghgh' });

    console.log(`👤 ${ghgh.name} (@${ghgh.username})`);
    console.log(`   Rank: ${ghgh.memberRank}`);

    const rankNumber = getRankNumber(ghgh.memberRank);
    const rankInfo = getRankInfo(rankNumber);

    console.log(`   Rank Number: ${rankNumber}`);
    console.log(`   Rank Name: ${rankInfo.name}`);
    console.log(`   Leadership Commission Rates:`);
    console.log(`     Gen1: ${rankInfo.leadershipCommission.generation1 * 100}%`);
    console.log(`     Gen2: ${rankInfo.leadershipCommission.generation2 * 100}%`);
    console.log(`     Gen3: ${rankInfo.leadershipCommission.generation3 * 100}%\n`);

    const leadershipComm = await calculateLeadershipCommission(User, ghgh._id);

    console.log('📊 Leadership Commission Calculation:');
    console.log(`   Total Points: ${leadershipComm.totalCommissionPoints}`);
    console.log(`   Total in Shekel: ${leadershipComm.commissionInShekel}`);
    console.log(`   Has Leadership: ${leadershipComm.hasLeadershipCommission}\n`);

    if (leadershipComm.breakdown && leadershipComm.breakdown.length > 0) {
      console.log('   Breakdown:');
      leadershipComm.breakdown.forEach(b => {
        console.log(`     Gen${b.generation}: ${b.generationPoints} pts × ${b.commissionRatePercent} = ${b.commissionInShekel} ₪`);
      });
    } else {
      console.log('   ❌ No leadership commission breakdown!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

check();
