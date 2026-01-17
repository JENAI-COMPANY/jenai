# Jenai - منصة التسويق التعاوني والتجارة الإلكترونية

منصة متكاملة للتسويق التعاوني والتجارة الإلكترونية تدعم العربية والإنجليزية.

## المميزات الرئيسية

### ثلاثة أنواع من المستخدمين:
1. **عميل عادي** - تصفح وشراء المنتجات كمتجر إلكتروني عادي
2. **مشترك في التسويق التعاوني** - الوصول إلى أسعار خاصة ومزايا التسويق التعاوني
3. **مدير النظام** - إدارة المنتجات والمستخدمين والطلبات

### نظام العمولات
- 9 مستويات من الرتب (من Bronze إلى Diamond Elite)
- نظام عمولات القيادة (Leadership Commission)
- حساب الأرباح حسب الفترات الزمنية
- تصدير تقارير PDF للأرباح

## التقنيات المستخدمة

- **Frontend**: React.js, GSAP للرسوم المتحركة
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## التثبيت على InterServer

### 1. تحضير قاعدة البيانات

قم بإنشاء قاعدة بيانات MongoDB على InterServer واحصل على رابط الاتصال.

### 2. إعداد Backend

```bash
cd backend
npm install
```

قم بتعديل ملف `.env`:
```
PORT=5000
MONGODB_URI=mongodb://your-interserver-db-host:27017/cooperative-marketing
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### 3. إعداد Frontend

```bash
cd frontend
npm install
npm run build
```

قم بتحديث `package.json` في Frontend وغيّر `proxy` إلى رابط السيرفر الخاص بك.

### 4. رفع الملفات

- ارفع مجلد `backend` إلى السيرفر
- ارفع محتويات مجلد `frontend/build` إلى مجلد public_html

### 5. تشغيل Backend

```bash
cd backend
npm start
```

أو استخدم PM2 للتشغيل المستمر:
```bash
npm install -g pm2
pm2 start server.js --name jenai-backend
pm2 save
pm2 startup
```

## معلومات الاتصال

- **خدمة العملاء**: service@jenai-4u.com
- **الإدارة**: maneger@jenai-4u.com
- **صاحب الشركة**: 00970598809058
- **المدير المالي - ريم قلالوة**: 00970569464046
- **خدمة العملاء**: 00970599020888
- **مدير فرع غزة - عبد الرحمن شكور**: 00970566999960
