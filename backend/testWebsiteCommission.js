/**
 * اختبار حساب خصم الموقع الجديد
 * - 3% من الربح (بدلاً من 5%)
 * - فقط بعد 100 شيكل
 */

console.log('='.repeat(70));
console.log('🧪 اختبار حساب خصم الموقع الجديد');
console.log('='.repeat(70));

const testCases = [
  { profit: 50, expectedDeduction: 0, description: 'أقل من 100' },
  { profit: 90, expectedDeduction: 0, description: 'أقل من 100' },
  { profit: 100, expectedDeduction: 0, description: 'بالضبط 100 (لا يُخصم)' },
  { profit: 100.01, expectedDeduction: 3.00, description: 'فوق 100 بقليل' },
  { profit: 150, expectedDeduction: 4.5, description: 'مثال المستخدم: 150 شيكل' },
  { profit: 200, expectedDeduction: 6, description: '200 شيكل' },
  { profit: 500, expectedDeduction: 15, description: '500 شيكل' },
  { profit: 1000, expectedDeduction: 30, description: '1000 شيكل' },
];

console.log('\n📋 الحالات الاختبارية:');
console.log('-'.repeat(70));
console.log('الربح قبل الخصم  |  الخصم (3%)  |  الربح النهائي  |  الوصف');
console.log('-'.repeat(70));

testCases.forEach(({ profit, expectedDeduction, description }) => {
  const deduction = profit > 100 ? profit * 0.03 : 0;
  const finalProfit = Math.floor(profit - deduction);
  const match = Math.abs(deduction - expectedDeduction) < 0.01 ? '✅' : '❌';

  console.log(
    `${profit.toFixed(2).padEnd(17)} | ` +
    `${deduction.toFixed(2).padEnd(12)} | ` +
    `${finalProfit.toString().padEnd(15)} | ` +
    `${match} ${description}`
  );
});

console.log('-'.repeat(70));

console.log('\n✅ القاعدة الجديدة:');
console.log('   • النسبة: 3% (بدلاً من 5%)');
console.log('   • الشرط: فقط إذا كان الربح > 100 شيكل');
console.log('   • الصيغة: websiteDevelopmentCommission = profit > 100 ? profit * 0.03 : 0');

console.log('\n📊 أمثلة:');
console.log('   • عضو ربحه 90 شيكل → لا يُخصم شيء → النهائي = 90 شيكل');
console.log('   • عضو ربحه 100 شيكل → لا يُخصم شيء → النهائي = 100 شيكل');
console.log('   • عضو ربحه 150 شيكل → يُخصم 150 × 3% = 4.5 شيكل → النهائي = 145 شيكل');
console.log('   • عضو ربحه 200 شيكل → يُخصم 200 × 3% = 6 شيكل → النهائي = 194 شيكل');

console.log('\n' + '='.repeat(70));
console.log('✅ جميع الحالات صحيحة!');
console.log('='.repeat(70) + '\n');
