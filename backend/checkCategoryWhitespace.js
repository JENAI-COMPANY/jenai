const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

  const Product = require('./models/Product');
  const Category = require('./models/Category');

  // جلب جميع الفئات الفريدة من المنتجات
  const productCategories = await Product.distinct('category');

  console.log('\n========================================');
  console.log('فحص المسافات في أسماء الفئات');
  console.log('========================================\n');

  console.log('الفئات من المنتجات:');
  productCategories.forEach((cat, i) => {
    const hasLeadingSpace = cat !== cat.trimStart();
    const hasTrailingSpace = cat !== cat.trimEnd();
    const length = cat.length;
    const trimmedLength = cat.trim().length;

    console.log(`\n${i + 1}. "${cat}"`);
    console.log(`   الطول: ${length} (بعد التشذيب: ${trimmedLength})`);
    if (hasLeadingSpace) console.log('   ⚠️ يحتوي على مسافات في البداية');
    if (hasTrailingSpace) console.log('   ⚠️ يحتوي على مسافات في النهاية');
    if (!hasLeadingSpace && !hasTrailingSpace && length === trimmedLength) {
      console.log('   ✅ لا يحتوي على مسافات زائدة');
    }
  });

  // البحث عن الفئة المحددة
  const targetCategory = 'قسم خدمات السوشيال ميديا';
  console.log('\n========================================');
  console.log(`البحث عن الفئة: "${targetCategory}"`);
  console.log('========================================\n');

  const exactMatch = productCategories.find(cat => cat === targetCategory);
  const trimmedMatch = productCategories.find(cat => cat.trim() === targetCategory.trim());

  console.log(`مطابقة دقيقة: ${exactMatch ? '✅ موجودة' : '❌ غير موجودة'}`);
  console.log(`مطابقة بعد التشذيب: ${trimmedMatch ? '✅ موجودة' : '❌ غير موجودة'}`);

  if (trimmedMatch && !exactMatch) {
    console.log('\n⚠️ تحذير: الفئة موجودة لكن بمسافات زائدة!');
    console.log(`الفئة الفعلية: "${trimmedMatch}"`);
    console.log(`الطول: ${trimmedMatch.length}`);

    // عرض كل حرف مع كود Unicode
    console.log('\nالأحرف بالترتيب:');
    for (let i = 0; i < trimmedMatch.length; i++) {
      const char = trimmedMatch[i];
      const code = trimmedMatch.charCodeAt(i);
      console.log(`   [${i}] '${char}' (U+${code.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  }

  // البحث عن فئات مشابهة
  const similarCategories = productCategories.filter(cat =>
    cat.includes('سوشيال') ||
    cat.includes('ميديا') ||
    cat.includes('خدمات')
  );

  if (similarCategories.length > 0) {
    console.log('\n========================================');
    console.log('الفئات المشابهة:');
    console.log('========================================\n');
    similarCategories.forEach(cat => {
      console.log(`- "${cat}" (الطول: ${cat.length})`);
    });
  }

  // عد المنتجات في كل فئة مشابهة
  console.log('\n========================================');
  console.log('عدد المنتجات في الفئات المشابهة:');
  console.log('========================================\n');

  for (const cat of similarCategories) {
    const count = await Product.countDocuments({ category: cat });
    console.log(`"${cat}": ${count} منتج`);
  }

  mongoose.disconnect();
  console.log('\n✅ تم الانتهاء');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
