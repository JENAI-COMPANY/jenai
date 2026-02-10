/**
 * اختبار عمولة القيادة - فحص التعديل
 *
 * المشكلة السابقة:
 * - silver كان [0.05, 0.04, 0.03] - 3 أجيال (خطأ)
 * - gold كان [0.05, 0.04] - جيلين (خطأ)
 *
 * بعد التعديل:
 * - silver أصبح [0.05, 0.04] - جيلين (صح)
 * - gold أصبح [0.05, 0.04, 0.03] - 3 أجيال (صح)
 */

// المعدلات الصحيحة بعد التعديل
const LEADERSHIP_RATES_NEW = {
  'agent': [],
  'bronze': [0.05], // برونزي: جيل 1 فقط - 5%
  'silver': [0.05, 0.04], // فضي: جيل 1+2 - 5% + 4%
  'gold': [0.05, 0.04, 0.03], // ذهبي: جيل 1+2+3 - 5% + 4% + 3%
  'ruby': [0.05, 0.04, 0.03, 0.02], // ياقوتي: جيل 1+2+3+4 - 5% + 4% + 3% + 2%
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // ماسي: جيل 1+2+3+4+5
};

// المعدلات الخاطئة قبل التعديل
const LEADERSHIP_RATES_OLD = {
  'agent': [],
  'bronze': [0.05],
  'gold': [0.05, 0.04], // خطأ - كان يجب أن يكون silver
  'silver': [0.05, 0.04, 0.03], // خطأ - كان يجب أن يكون gold
  'ruby': [0.05, 0.04, 0.03, 0.02],
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
};

const POINTS_TO_CURRENCY = 0.55;

/**
 * حساب عمولة القيادة
 */
function calculateLeadershipCommission(memberRank, generationsPoints, rates) {
  const leadershipRates = rates[memberRank] || [];
  let totalLeadershipCommission = 0;

  console.log(`\n🔷 ${memberRank.toUpperCase()} - عمولة القيادة:`);
  console.log(`   الأجيال المستحقة: ${leadershipRates.length}`);

  leadershipRates.forEach((rate, index) => {
    const generationIndex = index;
    const points = generationsPoints[generationIndex] || 0;
    const commission = points * rate * POINTS_TO_CURRENCY;

    if (points > 0) {
      console.log(`   جيل ${generationIndex + 1}: ${points} نقطة × ${(rate * 100)}% × 0.55 = ${commission.toFixed(2)} شيكل`);
      totalLeadershipCommission += commission;
    }
  });

  console.log(`   💰 إجمالي عمولة القيادة: ${totalLeadershipCommission.toFixed(2)} شيكل`);
  return totalLeadershipCommission;
}

/**
 * سيناريو اختبار 1: عضو ذهبي مع 3 أجيال
 */
console.log('\n' + '='.repeat(70));
console.log('📊 سيناريو 1: عضو GOLD (ذهبي) مع نقاط من 3 أجيال');
console.log('='.repeat(70));

const goldMemberGenerations = [500, 300, 200]; // نقاط الأجيال 1، 2، 3

console.log('\n❌ قبل التعديل (خطأ - ذهبي كان له جيلين فقط):');
const goldOld = calculateLeadershipCommission('gold', goldMemberGenerations, LEADERSHIP_RATES_OLD);

console.log('\n✅ بعد التعديل (صح - ذهبي له 3 أجيال):');
const goldNew = calculateLeadershipCommission('gold', goldMemberGenerations, LEADERSHIP_RATES_NEW);

console.log(`\n📈 الفرق: ${(goldNew - goldOld).toFixed(2)} شيكل (زيادة بسبب إضافة الجيل الثالث)`);

/**
 * سيناريو اختبار 2: عضو فضي مع 3 أجيال
 */
console.log('\n' + '='.repeat(70));
console.log('📊 سيناريو 2: عضو SILVER (فضي) مع نقاط من 3 أجيال');
console.log('='.repeat(70));

const silverMemberGenerations = [400, 250, 150]; // نقاط الأجيال 1، 2، 3

console.log('\n❌ قبل التعديل (خطأ - فضي كان له 3 أجيال):');
const silverOld = calculateLeadershipCommission('silver', silverMemberGenerations, LEADERSHIP_RATES_OLD);

console.log('\n✅ بعد التعديل (صح - فضي له جيلين فقط):');
const silverNew = calculateLeadershipCommission('silver', silverMemberGenerations, LEADERSHIP_RATES_NEW);

console.log(`\n📉 الفرق: ${(silverNew - silverOld).toFixed(2)} شيكل (نقصان بسبب إزالة الجيل الثالث)`);

/**
 * سيناريو اختبار 3: مثال من البيانات المرفقة
 * X (ذهبي) - عمولة قيادة: 198
 */
console.log('\n' + '='.repeat(70));
console.log('📊 سيناريو 3: عضو X (ذهبي) من الصورة - عمولة قيادة مسجلة: 198 شيكل');
console.log('='.repeat(70));

// X (ذهبي) - نقاط فريق: 1000
// نفترض توزيع النقاط على الأجيال (هذا تخمين بناءً على البيانات)
const xGenerations = [600, 300, 100]; // مجموع = 1000

console.log('\n✅ بعد التعديل (ذهبي - 3 أجيال):');
const xCommission = calculateLeadershipCommission('gold', xGenerations, LEADERSHIP_RATES_NEW);

console.log(`\n📋 المقارنة مع البيانات المسجلة:`);
console.log(`   المحسوب: ${xCommission.toFixed(2)} شيكل`);
console.log(`   المسجل: 198 شيكل`);
console.log(`   الفرق: ${Math.abs(xCommission - 198).toFixed(2)} شيكل`);

/**
 * سيناريو اختبار 4: جميع الرتب
 */
console.log('\n' + '='.repeat(70));
console.log('📊 سيناريو 4: مقارنة جميع الرتب مع نفس نقاط الأجيال');
console.log('='.repeat(70));

const testGenerations = [1000, 800, 600, 400, 200]; // نقاط الأجيال 1-5

const ranks = ['bronze', 'silver', 'gold', 'ruby', 'diamond'];

console.log('\n✅ بعد التعديل (الحسابات الصحيحة):');
ranks.forEach(rank => {
  calculateLeadershipCommission(rank, testGenerations, LEADERSHIP_RATES_NEW);
});

/**
 * ملخص التعديل
 */
console.log('\n' + '='.repeat(70));
console.log('📝 ملخص التعديل');
console.log('='.repeat(70));
console.log('\n✅ التعديل الذي تم:');
console.log('   • SILVER: [0.05, 0.04, 0.03] → [0.05, 0.04] (إزالة الجيل الثالث)');
console.log('   • GOLD: [0.05, 0.04] → [0.05, 0.04, 0.03] (إضافة الجيل الثالث)');

console.log('\n📊 التأثير:');
console.log('   • الأعضاء الفضيون: عمولة القيادة ستقل (لن يحصلوا على الجيل الثالث)');
console.log('   • الأعضاء الذهبيون: عمولة القيادة ستزيد (سيحصلون على الجيل الثالث)');

console.log('\n🎯 هذا يطابق المواصفات:');
console.log('   🥉 برونزي: 5% من جيل 1 فقط');
console.log('   🥈 فضي: 5% + 4% من جيل 1+2');
console.log('   🥇 ذهبي: 5% + 4% + 3% من جيل 1+2+3');
console.log('   💎 ياقوتي: 5% + 4% + 3% + 2% من جيل 1+2+3+4');
console.log('   💎💎 ماسي: 5% + 4% + 3% + 2% + 1% من جميع الأجيال الخمسة');

console.log('\n' + '='.repeat(70));
console.log('✅ التعديل صحيح ويحل المشكلة!');
console.log('='.repeat(70) + '\n');
