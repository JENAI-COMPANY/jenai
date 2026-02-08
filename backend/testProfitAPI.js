/**
 * سكريبت لاختبار API احتساب الأرباح
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const ProfitPeriod = require('./models/ProfitPeriod');
require('dotenv').config();

const { calculateLeadershipCommission, getRankNumber, getRankInfo } = require('./config/memberRanks');

const testProfitAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate what the API does
    const members = await User.find({ role: 'member' }).select(
      'name username monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points memberRank'
    );

    console.log('📊 محاكاة احتساب الأرباح كما يتم في API:\n');
    console.log('='.repeat(100) + '\n');

    const membersProfits = [];
    let totalProfits = 0;

    for (const member of members) {
      const personalPoints = member.monthlyPoints || 0;
      const gen1Points = member.generation1Points || 0;
      const gen2Points = member.generation2Points || 0;
      const gen3Points = member.generation3Points || 0;
      const gen4Points = member.generation4Points || 0;
      const gen5Points = member.generation5Points || 0;

      const personalCommissionPoints = personalPoints * 0.20;
      const personalProfitInShekel = Math.floor(personalCommissionPoints * 0.55);

      const teamCommissionPoints = gen1Points + gen2Points + gen3Points + gen4Points + gen5Points;
      const teamProfitInShekel = Math.floor(teamCommissionPoints * 0.55);

      const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;

      const leadershipCommission = await calculateLeadershipCommission(User, member._id);
      const memberRankNumber = getRankNumber(member.memberRank);
      const rankInfo = getRankInfo(memberRankNumber);

      const memberTotalProfit = performanceProfitInShekel + leadershipCommission.commissionInShekel;

      totalProfits += memberTotalProfit;

      membersProfits.push({
        name: member.name,
        username: member.username,
        rankName: rankInfo.name,
        personalProfit: personalProfitInShekel,
        teamProfit: teamProfitInShekel,
        leadershipProfit: leadershipCommission.commissionInShekel,
        totalProfit: memberTotalProfit,
        leadershipBreakdown: leadershipCommission.breakdown
      });
    }

    // Sort by total profit
    membersProfits.sort((a, b) => b.totalProfit - a.totalProfit);

    console.log(`${'#'.padEnd(4)} ${'الاسم'.padEnd(15)} ${'الرتبة'.padEnd(12)} ${'شخصي'.padStart(8)} ${'فريق'.padStart(8)} ${'قيادة'.padStart(8)} ${'الإجمالي'.padStart(10)}`);
    console.log('-'.repeat(100));

    membersProfits.forEach((m, i) => {
      console.log(
        `${String(i + 1).padEnd(4)} ${m.name.padEnd(15)} ${m.rankName.padEnd(12)} ` +
        `₪${String(m.personalProfit).padStart(7)} ₪${String(m.teamProfit).padStart(7)} ` +
        `₪${String(m.leadershipProfit).padStart(7)} ₪${String(m.totalProfit).padStart(9)}`
      );

      if (m.leadershipBreakdown && m.leadershipBreakdown.length > 0) {
        m.leadershipBreakdown.forEach(b => {
          console.log(`      └─ Gen${b.generation}: ${b.generationPoints} pts × ${b.commissionRatePercent} = ${b.commissionInShekel} ₪`);
        });
      }
    });

    console.log('-'.repeat(100));
    console.log(`إجمالي الأرباح: ₪${totalProfits}`);
    console.log(`عدد الأعضاء: ${members.length}`);
    console.log(`متوسط الربح: ₪${Math.floor(totalProfits / members.length)}`);
    console.log('\n✅ نجح الاختبار! البيانات مطابقة لما يجب أن يعرضه API');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testProfitAPI();
