/**
 * محاكاة حساب عمولة القيادة للمستخدم T (ياقوتي)
 * بناءً على البيانات من الصورة
 */

const LEADERSHIP_RATES = {
  'agent': [],
  'bronze': [0.05],
  'silver': [0.05, 0.04],
  'gold': [0.05, 0.04, 0.03],
  'ruby': [0.05, 0.04, 0.03, 0.02],
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
};

const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02]; // 11%, 8%, 6%, 3%, 2%
const POINTS_TO_CURRENCY = 0.55;

console.log('='.repeat(70));
console.log('🔍 محاكاة حساب عمولة القيادة للمستخدم T (ياقوتي)');
console.log('='.repeat(70));

// البيانات من الصورة
const userData = {
  name: 'T',
  username: '@t',
  rank: 'ruby',
  personalPoints: 200,
  teamPoints: 3275,
  personalCommission: 22,
  teamCommission: 1801,
  leadershipCommission: 360, // القيمة الحالية (خطأ)
  expectedLeadershipCommission: 843 // القيمة المتوقعة (صح)
};

console.log('\n📊 البيانات من الصورة:');
console.log(`الاسم: ${userData.name} (${userData.username})`);
console.log(`الرتبة: ${userData.rank.toUpperCase()}`);
console.log(`النقاط الشخصية: ${userData.personalPoints}`);
console.log(`نقاط الفريق: ${userData.teamPoints}`);
console.log(`عمولة شخصية: ${userData.personalCommission} شيكل`);
console.log(`عمولة فريق: ${userData.teamCommission} شيكل`);
console.log(`عمولة قيادة (الحالية): ${userData.leadershipCommission} شيكل ❌`);
console.log(`عمولة قيادة (المتوقعة): ${userData.expectedLeadershipCommission} شيكل ✅`);

// حساب نقاط القيادة المطلوبة للوصول للعمولة المتوقعة
const requiredLeadershipPoints = userData.expectedLeadershipCommission / POINTS_TO_CURRENCY;
const currentLeadershipPoints = userData.leadershipCommission / POINTS_TO_CURRENCY;

console.log('\n' + '='.repeat(70));
console.log('🔢 تحليل نقاط القيادة');
console.log('='.repeat(70));
console.log(`نقاط القيادة الحالية: ${currentLeadershipPoints.toFixed(2)} نقطة (من ${userData.leadershipCommission} شيكل)`);
console.log(`نقاط القيادة المطلوبة: ${requiredLeadershipPoints.toFixed(2)} نقطة (للوصول إلى ${userData.expectedLeadershipCommission} شيكل)`);
console.log(`الفرق: ${(requiredLeadershipPoints - currentLeadershipPoints).toFixed(2)} نقطة`);

// محاولة تحليل توزيع النقاط على الأجيال
console.log('\n' + '='.repeat(70));
console.log('📈 تحليل توزيع النقاط على الأجيال');
console.log('='.repeat(70));

// الياقوتي يحصل على عمولة قيادة من 4 أجيال: [5%, 4%, 3%, 2%]
const rubyLeadershipRates = LEADERSHIP_RATES['ruby'];
console.log(`\nالياقوتي يحصل على عمولة قيادة من ${rubyLeadershipRates.length} أجيال:`);
rubyLeadershipRates.forEach((rate, i) => {
  console.log(`  جيل ${i + 1}: ${(rate * 100)}%`);
});

// لنفترض سيناريوهات مختلفة لتوزيع نقاط الأجيال
console.log('\n' + '='.repeat(70));
console.log('💡 سيناريوهات توزيع النقاط');
console.log('='.repeat(70));

// سيناريو 1: توزيع متساوٍ
console.log('\n📊 سيناريو 1: توزيع نقاط الطلبات بالتساوي على الأجيال الأربعة');
const totalOrderPoints = userData.teamPoints; // افتراض أن كل نقاط الفريق من طلبات
const pointsPerGen1 = totalOrderPoints / 4;

let totalLeadership1 = 0;
for (let i = 0; i < 4; i++) {
  const leadershipPoints = pointsPerGen1 * rubyLeadershipRates[i];
  const commission = leadershipPoints * POINTS_TO_CURRENCY;
  console.log(`  جيل ${i + 1}: ${pointsPerGen1.toFixed(2)} نقطة × ${(rubyLeadershipRates[i] * 100)}% = ${leadershipPoints.toFixed(2)} نقطة قيادة = ${commission.toFixed(2)} شيكل`);
  totalLeadership1 += commission;
}
console.log(`  💰 إجمالي: ${totalLeadership1.toFixed(2)} شيكل`);

// سيناريو 2: توزيع واقعي (جيل 1 أكثر من جيل 2، إلخ)
console.log('\n📊 سيناريو 2: توزيع واقعي (نقاط أكثر في الأجيال الأولى)');
const gen1Points = totalOrderPoints * 0.4;
const gen2Points = totalOrderPoints * 0.3;
const gen3Points = totalOrderPoints * 0.2;
const gen4Points = totalOrderPoints * 0.1;
const genPoints = [gen1Points, gen2Points, gen3Points, gen4Points];

let totalLeadership2 = 0;
for (let i = 0; i < 4; i++) {
  const leadershipPoints = genPoints[i] * rubyLeadershipRates[i];
  const commission = leadershipPoints * POINTS_TO_CURRENCY;
  console.log(`  جيل ${i + 1}: ${genPoints[i].toFixed(2)} نقطة × ${(rubyLeadershipRates[i] * 100)}% = ${leadershipPoints.toFixed(2)} نقطة قيادة = ${commission.toFixed(2)} شيكل`);
  totalLeadership2 += commission;
}
console.log(`  💰 إجمالي: ${totalLeadership2.toFixed(2)} شيكل`);

// سيناريو 3: العكس - للوصول للمبلغ المتوقع 843
console.log('\n📊 سيناريو 3: ما هي نقاط الأجيال اللازمة للوصول إلى 843 شيكل؟');

// نحتاج: 843 / 0.55 = 1532.7 نقطة قيادة
// نقاط قيادة = sum(نقاط الجيل × نسبة القيادة)
// للياقوتي: نقاط_قيادة = gen1*0.05 + gen2*0.04 + gen3*0.03 + gen4*0.02

// لنفترض توزيع واقعي
const targetLeadershipPoints = requiredLeadershipPoints;
// إذا كانت نقاط الطلبات الإجمالية = X
// ونقاط الأجيال: gen1=0.4X, gen2=0.3X, gen3=0.2X, gen4=0.1X
// نقاط_قيادة = 0.4X*0.05 + 0.3X*0.04 + 0.2X*0.03 + 0.1X*0.02
//            = 0.02X + 0.012X + 0.006X + 0.002X
//            = 0.04X
// إذا نقاط_قيادة = 1532.7
// X = 1532.7 / 0.04 = 38,317.5 نقطة

const requiredTotalPoints = targetLeadershipPoints / 0.04;
console.log(`  نقاط الطلبات الإجمالية المطلوبة: ${requiredTotalPoints.toFixed(2)} نقطة`);

const gen1_required = requiredTotalPoints * 0.4;
const gen2_required = requiredTotalPoints * 0.3;
const gen3_required = requiredTotalPoints * 0.2;
const gen4_required = requiredTotalPoints * 0.1;

let totalLeadership3 = 0;
const requiredGenPoints = [gen1_required, gen2_required, gen3_required, gen4_required];

for (let i = 0; i < 4; i++) {
  const leadershipPoints = requiredGenPoints[i] * rubyLeadershipRates[i];
  const commission = leadershipPoints * POINTS_TO_CURRENCY;
  console.log(`  جيل ${i + 1}: ${requiredGenPoints[i].toFixed(2)} نقطة × ${(rubyLeadershipRates[i] * 100)}% = ${leadershipPoints.toFixed(2)} نقطة قيادة = ${commission.toFixed(2)} شيكل`);
  totalLeadership3 += commission;
}
console.log(`  💰 إجمالي: ${totalLeadership3.toFixed(2)} شيكل ✅`);

// تحليل المشكلة
console.log('\n' + '='.repeat(70));
console.log('🔍 تحليل المشكلة');
console.log('='.repeat(70));

console.log('\n❓ لماذا الفرق بين 360 و 843 شيكل؟');
console.log(`   الفرق: ${userData.expectedLeadershipCommission - userData.leadershipCommission} شيكل`);
console.log(`   نسبة الزيادة: ${((userData.expectedLeadershipCommission / userData.leadershipCommission - 1) * 100).toFixed(1)}%`);

console.log('\n💡 الأسباب المحتملة:');
console.log('   1️⃣ خطأ في معدلات القيادة (silver و gold كانوا مبدلين) ✅ تم الإصلاح');
console.log('   2️⃣ بعض الطلبات لم يتم احتساب عمولة القيادة لها');
console.log('   3️⃣ الرتبة تغيرت أثناء الطلبات (من رتبة أقل إلى ياقوتي)');
console.log('   4️⃣ مشكلة في حفظ أو تراكم نقاط القيادة');

console.log('\n' + '='.repeat(70));
console.log('✅ الحل');
console.log('='.repeat(70));
console.log('\n1. ✅ تم إصلاح معدلات القيادة (silver و gold)');
console.log('2. ✅ الطلبات الجديدة ستحسب عمولة القيادة بشكل صحيح');
console.log('3. ⚠️ الطلبات القديمة قد تحتاج إعادة حساب إذا كانت الرتبة خاطئة');
console.log('\n💡 التوصية: فحص الطلبات القديمة للمستخدم T وإعادة حساب العمولات إذا لزم الأمر');

console.log('\n' + '='.repeat(70));
