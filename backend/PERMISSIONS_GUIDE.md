# دليل الصلاحيات - Permissions Guide

## نظرة عامة | Overview

نظام الصلاحيات يتحكم في وصول المديرين إلى البيانات والموارد في النظام.

The permissions system controls admin access to data and resources in the system.

---

## أنواع المديرين | Admin Types

### 1. Super Admin (المدير العام)
- **الصلاحيات**: وصول كامل لجميع الموارد والبيانات
- **القيود**: لا توجد قيود
- **Full access** to all resources and data
- **No restrictions**

### 2. Regional Admin (مدير المنطقة)
- **الصلاحيات**: يمكن إدارة البيانات **فقط** في منطقته المحددة
- **القيود**:
  - محدود بمنطقة واحدة فقط
  - لا يمكن الوصول إلى مناطق أخرى
- Can manage data **only** in their assigned region
- **Restrictions**:
  - Limited to one region
  - Cannot access other regions

### 3. Category Admin (مدير القسم)
- **الصلاحيات**: يمكن إدارة المنتجات **فقط** في الأقسام المحددة له
- **القيود**:
  - محدود بالأقسام المخصصة له
  - لا يمكن الوصول إلى أقسام أخرى
- **ميزة خاصة**: يمكن تعيينه لإدارة **أكثر من قسم** في نفس الوقت
- Can manage products **only** in assigned categories
- **Restrictions**:
  - Limited to assigned categories
  - Cannot access other categories
- **Special Feature**: Can be assigned to manage **multiple categories** simultaneously

---

## الصلاحيات المتاحة | Available Permissions

| Permission | Arabic | Description |
|------------|--------|-------------|
| `canViewMembers` | عرض الأعضاء | View members list |
| `canManageMembers` | إدارة الأعضاء | Add/Edit/Delete members |
| `canViewProducts` | عرض المنتجات | View products list |
| `canManageProducts` | إدارة المنتجات | Add/Edit/Delete products |

---

## كيفية تعيين الصلاحيات | How to Assign Permissions

### من لوحة التحكم | From Admin Dashboard

1. **للمديرين الإقليميين | For Regional Admins:**
   - اذهب إلى: إدارة المستخدمين → اختر مدير المنطقة → حدد المنطقة
   - اذهب إلى: إدارة الصلاحيات → فعّل الصلاحيات المطلوبة

   - Go to: User Management → Select Regional Admin → Assign Region
   - Go to: Permissions Management → Enable required permissions

2. **لمديري الأقسام | For Category Admins:**
   - اذهب إلى: إدارة الأقسام → علامة تبويب "مدراء الأقسام"
   - أضف مدير قسم جديد أو عدّل موجود
   - اذهب إلى: إدارة الأقسام → اضغط "إدارة المديرين" على القسم
   - اختر المديرين المصرح لهم

   - Go to: Category Management → "Category Admins" tab
   - Add new or edit existing category admin
   - Go to: Category Management → Click "Manage Admins" on category
   - Select authorized admins

---

## استخدام Middleware في الكود | Using Middleware in Code

### مثال 1: حماية route لمديري المناطق
### Example 1: Protect route for regional admins

\`\`\`javascript
const { checkRegionalAccess, canViewMembers } = require('../middleware/permissions');

// Regional admin can only view members in their region
router.get('/members',
  protect,                    // Check authentication
  checkRegionalAccess,        // Check regional admin role and region assignment
  canViewMembers,             // Check permission
  async (req, res) => {
    // req.userRegion contains the admin's region
    const members = await User.find({ region: req.userRegion });
    res.json({ members });
  }
);
\`\`\`

### مثال 2: حماية route لمديري الأقسام
### Example 2: Protect route for category admins

\`\`\`javascript
const { checkCategoryAccess, canManageProducts } = require('../middleware/permissions');

// Category admin can only manage products in their assigned categories
router.post('/products',
  protect,                        // Check authentication
  checkCategoryAccess('category'), // Check category admin role and category access
  canManageProducts,              // Check permission
  async (req, res) => {
    // req.userCategories contains admin's categories
    const { category } = req.body;

    // This check is already done by middleware, but shown for clarity
    if (!req.userCategories.includes(category)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const product = await Product.create(req.body);
    res.json({ product });
  }
);
\`\`\`

### مثال 3: فلترة البيانات حسب الصلاحيات
### Example 3: Filter data based on permissions

\`\`\`javascript
router.get('/products', protect, async (req, res) => {
  const user = req.user;
  let query = { isActive: true };

  // Super admin sees everything
  if (user.role === 'super_admin') {
    // No filter needed
  }
  // Regional admin sees only their region
  else if (user.role === 'regional_admin' && user.region) {
    query.region = user.region;
  }
  // Category admin sees only their categories
  else if (user.role === 'category_admin' && user.managedCategories) {
    query.category = { $in: user.managedCategories };
  }

  const products = await Product.find(query);
  res.json({ products });
});
\`\`\`

---

## سكريبتات الاختبار | Test Scripts

### 1. اختبار صلاحيات مديري المناطق
### Test Regional Admin Permissions

\`\`\`bash
node scripts/testRegionalAdminPermissions.js
\`\`\`

**يعرض:**
- قائمة بجميع مديري المناطق
- المنطقة المخصصة لكل مدير
- الصلاحيات المفعلة والمعطلة
- البيانات التي يمكنهم الوصول إليها
- القيود على الوصول

### 2. اختبار صلاحيات مديري الأقسام
### Test Category Admin Permissions

\`\`\`bash
node scripts/testCategoryAdminPermissions.js
\`\`\`

**يعرض:**
- قائمة بجميع مديري الأقسام
- الأقسام المخصصة لكل مدير
- الصلاحيات المفعلة والمعطلة
- المنتجات في الأقسام المخصصة
- القيود على الوصول

### 3. إعداد صلاحيات تجريبية
### Setup Test Permissions

\`\`\`bash
node scripts/setupTestPermissions.js
\`\`\`

**يقوم بـ:**
- تعيين مناطق لمديري المناطق
- تعيين أقسام لمديري الأقسام
- تفعيل جميع الصلاحيات للاختبار

---

## أمثلة عملية | Practical Examples

### مثال 1: مدير منطقة "جنين"
**الصلاحيات:**
- ✅ عرض الأعضاء في جنين
- ✅ إدارة الأعضاء في جنين
- ❌ لا يمكن رؤية أعضاء منطقة "نابلس"
- ❌ لا يمكن رؤية أعضاء منطقة "رام الله"

### مثال 2: مدير قسم "البهارات" و "الأغذية"
**الصلاحيات:**
- ✅ عرض وإدارة منتجات قسم "البهارات"
- ✅ عرض وإدارة منتجات قسم "الأغذية"
- ❌ لا يمكن رؤية منتجات قسم "المنظفات"
- ❌ لا يمكن رؤية منتجات قسم "العطور"

**ملاحظة مهمة**: مدير القسم يمكن أن يدير **أكثر من قسم** في نفس الوقت!

---

## استكشاف الأخطاء | Troubleshooting

### المشكلة: "Access denied. No region assigned"
**الحل:**
1. اذهب إلى إدارة المستخدمين
2. اختر مدير المنطقة
3. حدد المنطقة من القائمة المنسدلة
4. احفظ التغييرات

### المشكلة: "Access denied. No categories assigned"
**الحل:**
1. اذهب إلى إدارة الأقسام
2. اضغط على زر "إدارة المديرين" بجانب القسم
3. اختر مديري الأقسام المصرح لهم
4. احفظ التغييرات

### المشكلة: الصلاحيات لا تعمل
**الحل:**
1. اذهب إلى إدارة الصلاحيات
2. تأكد من تفعيل الصلاحيات المطلوبة
3. احفظ التغييرات
4. اطلب من المستخدم تسجيل الخروج ثم الدخول مرة أخرى

---

## API Reference

### Middleware Functions

| Function | Purpose |
|----------|---------|
| `checkPermission(permissionName)` | Check specific permission |
| `checkRegionalAccess` | Check regional admin access |
| `checkCategoryAccess(categoryParam)` | Check category admin access |
| `canViewMembers` | Check view members permission |
| `canManageMembers` | Check manage members permission |
| `canViewProducts` | Check view products permission |
| `canManageProducts` | Check manage products permission |

---

## ملاحظات مهمة | Important Notes

1. **Super Admin** له صلاحيات كاملة دائماً ولا يحتاج إلى تفعيل صلاحيات
2. **Regional Admin** محدود بمنطقة واحدة فقط
3. **Category Admin** يمكن تعيينه لأكثر من قسم
4. الصلاحيات يجب أن تُفعّل يدوياً من صفحة "إدارة الصلاحيات"
5. بعد تغيير الصلاحيات، يُفضل تسجيل الخروج والدخول مرة أخرى

---

## للمطورين | For Developers

### إضافة صلاحية جديدة | Adding New Permission

1. أضف الصلاحية في `backend/models/User.js`:
\`\`\`javascript
permissions: {
  // ... existing permissions
  canNewFeature: { type: Boolean, default: false }
}
\`\`\`

2. أضف middleware في `backend/middleware/permissions.js`:
\`\`\`javascript
const canNewFeature = checkPermission('canNewFeature');
module.exports = { ..., canNewFeature };
\`\`\`

3. استخدمها في routes:
\`\`\`javascript
router.get('/feature', protect, canNewFeature, handler);
\`\`\`

4. أضفها في واجهة إدارة الصلاحيات

---

## الدعم | Support

للمساعدة أو الأسئلة، راجع:
- ملف README.md الرئيسي
- التوثيق التقني في `/docs`
- قسم Issues في المشروع

For help or questions, refer to:
- Main README.md file
- Technical documentation in `/docs`
- Project Issues section
