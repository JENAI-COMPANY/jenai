const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

  const ProfitPeriod = require('./models/ProfitPeriod');

  let period = await ProfitPeriod.findOne({ periodName: '99' }).lean();

  if (!period) {
    period = await ProfitPeriod.findOne({ periodNumber: 99 }).lean();
  }

  if (!period) {
    console.log('Period 99 not found. Available periods:');
    const periods = await ProfitPeriod.find({})
      .select('periodName periodNumber createdAt')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    periods.forEach((p, i) => {
      console.log(`${i + 1}. Name: "${p.periodName}" | Number: ${p.periodNumber || 'N/A'} | Date: ${p.createdAt}`);
    });

    mongoose.disconnect();
    return;
  }

  console.log(`\nFound period: "${period.periodName}" (Number ${period.periodNumber})`);
  console.log(`From ${period.startDate} to ${period.endDate}`);
  console.log(`Members: ${period.membersProfits.length}`);

  const tMember = period.membersProfits.find(m =>
    m.username && (m.username.toLowerCase() === 't' || m.username === 'T' || m.username.includes('@t'))
  );

  if (!tMember) {
    console.log('\nMember T not found. Members in this period:');
    period.membersProfits.slice(0, 10).forEach(m => {
      console.log(`   - ${m.username} (${m.memberName})`);
    });
    mongoose.disconnect();
    return;
  }

  console.log('\n========================================');
  console.log(`Member: ${tMember.memberName} (@${tMember.username})`);
  console.log('========================================');
  console.log(`Rank: ${tMember.rankName} (${tMember.rankNameEn})`);

  console.log('\nPoints:');
  console.log(`   Personal: ${tMember.points.personal}`);
  console.log(`   Gen 1: ${tMember.points.generation1}`);
  console.log(`   Gen 2: ${tMember.points.generation2}`);
  console.log(`   Gen 3: ${tMember.points.generation3}`);
  console.log(`   Gen 4: ${tMember.points.generation4}`);
  console.log(`   Gen 5: ${tMember.points.generation5}`);
  console.log(`   Total: ${tMember.points.total}`);

  console.log('\nCommissions:');
  console.log(`   Performance (points): ${tMember.commissions.performance.totalPoints}`);
  console.log(`   Performance (shekel): ${tMember.commissions.performance.totalInShekel}`);
  console.log(`   Leadership (points): ${tMember.commissions.leadership.totalCommissionPoints}`);
  console.log(`   Leadership (shekel): ${tMember.commissions.leadership.commissionInShekel}`);

  console.log('\nProfits:');
  console.log(`   Personal profit: ${tMember.profit.personalProfit} shekel`);
  console.log(`   Team profit: ${tMember.profit.teamProfit} shekel`);
  console.log(`   Performance profit: ${tMember.profit.performanceProfit} shekel`);
  console.log(`   Leadership profit: ${tMember.profit.leadershipProfit} shekel`);
  console.log(`   Customer commission: ${tMember.profit.customerPurchaseCommission} shekel`);
  console.log(`   Total before deduction: ${tMember.profit.totalProfitBeforeDeduction} shekel`);
  console.log(`   Website dev commission (3%): ${tMember.profit.websiteDevelopmentCommission} shekel`);
  console.log(`   Final total: ${tMember.profit.totalProfit} shekel`);

  console.log('\n========================================');
  console.log('Recalculating leadership commission:');
  console.log('========================================');

  const User = require('./models/User');
  const { calculateLeadershipCommission } = require('./config/memberRanks');

  const userDoc = await User.findById(tMember.memberId);
  console.log(`User found: ${userDoc.name} (@${userDoc.username})`);
  console.log(`   Rank: ${userDoc.memberRank}`);
  console.log(`   Monthly points: ${userDoc.monthlyPoints}`);

  const recalculated = await calculateLeadershipCommission(User, tMember.memberId);

  console.log('\nRecalculation result:');
  console.log(`   Commission points: ${recalculated.totalCommissionPoints}`);
  console.log(`   Commission shekel: ${recalculated.commissionInShekel}`);

  if (recalculated.breakdown && recalculated.breakdown.length > 0) {
    console.log('\n   Breakdown by generation:');
    recalculated.breakdown.forEach(gen => {
      console.log(`      Gen ${gen.generation}: ${gen.generationPoints} points × ${gen.commissionRatePercent} = ${gen.commissionInShekel} shekel`);
    });
  }

  console.log('\n========================================');
  console.log('Comparison:');
  console.log('========================================');
  console.log(`   Recorded in period: ${tMember.commissions.leadership.commissionInShekel} shekel`);
  console.log(`   Recalculated now: ${recalculated.commissionInShekel} shekel`);
  const difference = recalculated.commissionInShekel - tMember.commissions.leadership.commissionInShekel;
  console.log(`   Difference: ${difference} shekel ${difference > 0 ? '(extra)' : difference < 0 ? '(missing)' : '(match)'}`);

  mongoose.disconnect();
  console.log('\nDone');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
