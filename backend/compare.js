const mongoose = require('mongoose');
mongoose.connect('mongodb://104.218.48.119:27017/jenai_db').then(async () => {
  const db = mongoose.connection.db;

  // النظام القديم: يقرأ من حقول User مباشرة (تراكمي)
  const users = await db.collection('users').find({ role: 'member' }).toArray();
  
  const RATE = 0.55;
  let oldTotal = 0;
  let newTotal = 0;

  // جلب النتيجة الجديدة من الفترة المحتسبة
  const period = await db.collection('profitperiods').findOne({ periodName: 'test' });
  if (period) {
    for (const m of period.membersProfits) {
      newTotal += m.profit.totalProfit || 0;
    }
  }

  // حساب الطريقة القديمة
  const PERSONAL_RATE = 0.20;
  const TEAM_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];
  
  for (const u of users) {
    const personal = u.monthlyPoints || 0;
    const gen1 = u.generation1Points || 0;
    const gen2 = u.generation2Points || 0;
    const gen3 = u.generation3Points || 0;
    const gen4 = u.generation4Points || 0;
    const gen5 = u.generation5Points || 0;

    const personalProfit = Math.floor(personal * PERSONAL_RATE * RATE);
    const teamProfit = Math.floor((gen1*TEAM_RATES[0] + gen2*TEAM_RATES[1] + gen3*TEAM_RATES[2] + gen4*TEAM_RATES[3] + gen5*TEAM_RATES[4]) * RATE);
    oldTotal += personalProfit + teamProfit;
  }

  console.log('=== المقارنة ===');
  console.log('الطريقة القديمة (تراكمي بدون تاريخ):', oldTotal.toFixed(2), 'شيكل');
  console.log('الطريقة الجديدة (ضمن الفترة):', newTotal.toFixed(2), 'شيكل');
  console.log('الفرق:', (oldTotal - newTotal).toFixed(2), 'شيكل');
  process.exit(0);
});
