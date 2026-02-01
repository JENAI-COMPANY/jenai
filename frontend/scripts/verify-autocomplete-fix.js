/**
 * سكريبت للتحقق من إصلاح مشكلة autocomplete في جميع النماذج
 * Script to verify autocomplete fix across all forms
 */

const fs = require('fs');
const path = require('path');

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

// الملفات التي يجب أن تحتوي على نماذج مع autoComplete="off"
const filesToCheck = [
  // Components
  'src/components/ProductManagement.js',
  'src/components/CategoryManagement.js',
  'src/components/SliderManagement.js',
  'src/components/UserManagement.js',
  'src/components/MembersManagement.js',
  'src/components/SupplierManagement.js',
  'src/components/SuppliersManagement.js',
  'src/components/RegionsManagement.js',
  'src/components/ProfitPeriods.js',

  // Pages
  'src/pages/Register.js',
  'src/pages/Profile.js',
  'src/pages/Checkout.js',
  'src/pages/ContactUs.js',
  'src/pages/Login.js',
  'src/pages/ServicesManagement.js',
  'src/pages/Complaints.js'
];

let totalForms = 0;
let formsWithAutoComplete = 0;
let formsWithoutAutoComplete = 0;
let filesWithIssues = [];

console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║      التحقق من إصلاح مشكلة الـ Autocomplete              ║${colors.reset}`);
console.log(`${colors.blue}║      Verifying Autocomplete Fix                            ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}⚠  الملف غير موجود / File not found: ${filePath}${colors.reset}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // البحث عن جميع النماذج في الملف
  const formRegex = /<form[^>]*>/g;
  const forms = content.match(formRegex) || [];

  if (forms.length === 0) {
    return; // لا توجد نماذج في هذا الملف
  }

  totalForms += forms.length;

  let fileHasIssue = false;
  let fixedCount = 0;
  let notFixedCount = 0;

  console.log(`${colors.blue}📄 ${filePath}${colors.reset}`);

  forms.forEach((form, index) => {
    if (form.includes('autoComplete="off"') || form.includes("autoComplete='off'")) {
      formsWithAutoComplete++;
      fixedCount++;
      console.log(`   ${colors.green}✓ النموذج #${index + 1}: تم إضافة autoComplete="off"${colors.reset}`);
    } else {
      formsWithoutAutoComplete++;
      notFixedCount++;
      fileHasIssue = true;
      console.log(`   ${colors.red}✗ النموذج #${index + 1}: مفقود autoComplete="off"${colors.reset}`);
      console.log(`     ${colors.yellow}${form.substring(0, 80)}...${colors.reset}`);
    }
  });

  if (fileHasIssue) {
    filesWithIssues.push({
      file: filePath,
      notFixed: notFixedCount
    });
  }

  console.log(`   ${colors.blue}الإجمالي: ${forms.length} نموذج (${fixedCount} تم إصلاحها, ${notFixedCount} تحتاج إصلاح)${colors.reset}\n`);
});

// طباعة النتائج النهائية
console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║                      النتائج النهائية                      ║${colors.reset}`);
console.log(`${colors.blue}║                      Final Results                          ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

console.log(`📊 إجمالي النماذج المفحوصة / Total Forms: ${totalForms}`);
console.log(`${colors.green}✓ نماذج تم إصلاحها / Fixed Forms: ${formsWithAutoComplete}${colors.reset}`);
console.log(`${colors.red}✗ نماذج تحتاج إصلاح / Forms Need Fix: ${formsWithoutAutoComplete}${colors.reset}\n`);

if (filesWithIssues.length > 0) {
  console.log(`${colors.red}⚠  ملفات تحتاج إصلاح / Files with Issues:${colors.reset}`);
  filesWithIssues.forEach(item => {
    console.log(`   ${colors.red}- ${item.file} (${item.notFixed} نموذج)${colors.reset}`);
  });
  console.log('');
  process.exit(1);
} else {
  console.log(`${colors.green}🎉 ممتاز! جميع النماذج تم إصلاحها بنجاح!${colors.reset}`);
  console.log(`${colors.green}🎉 Excellent! All forms have been fixed successfully!${colors.reset}\n`);

  // فحص إضافي: التحقق من عدم وجود نماذج بدون autoComplete في ملفات أخرى
  console.log(`${colors.blue}🔍 فحص إضافي للملفات الأخرى...${colors.reset}`);
  console.log(`${colors.blue}🔍 Additional check for other files...${colors.reset}\n`);

  const componentsDir = path.join(__dirname, '..', 'src', 'components');
  const pagesDir = path.join(__dirname, '..', 'src', 'pages');

  let otherFormsFound = 0;
  let otherFormsFixed = 0;

  function checkDirectory(dir, type) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;

      const relativePath = `src/${type}/${file}`;
      if (filesToCheck.includes(relativePath)) return; // تم فحصه بالفعل

      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const forms = content.match(/<form[^>]*>/g) || [];

      if (forms.length > 0) {
        const withAutoComplete = forms.filter(f =>
          f.includes('autoComplete="off"') || f.includes("autoComplete='off'")
        ).length;

        otherFormsFound += forms.length;
        otherFormsFixed += withAutoComplete;

        if (withAutoComplete < forms.length) {
          console.log(`   ${colors.yellow}⚠  ${relativePath}: ${forms.length} نموذج (${withAutoComplete} تم إصلاحها)${colors.reset}`);
        }
      }
    });
  }

  checkDirectory(componentsDir, 'components');
  checkDirectory(pagesDir, 'pages');

  if (otherFormsFound > 0) {
    console.log(`\n📊 ملفات إضافية: ${otherFormsFound} نموذج (${otherFormsFixed} تم إصلاحها)\n`);
  } else {
    console.log(`\n${colors.green}✓ لا توجد ملفات إضافية تحتاج فحص${colors.reset}\n`);
  }

  process.exit(0);
}
