# دليل النشر على InterServer

## الخطوات المطلوبة للنشر

### 1. إعداد قاعدة البيانات MongoDB

#### على InterServer:
1. قم بتسجيل الدخول إلى لوحة التحكم في InterServer
2. انتقل إلى قسم Databases
3. أنشئ قاعدة بيانات MongoDB جديدة
4. احتفظ بمعلومات الاتصال:
   - Host (عنوان السيرفر)
   - Port (المنفذ - عادة 27017)
   - Username (اسم المستخدم)
   - Password (كلمة المرور)
   - Database Name: `cooperative-marketing`

### 2. إعداد Backend

#### تعديل ملف `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://username:password@host:27017/cooperative-marketing
JWT_SECRET=your_very_strong_secret_key_min_32_characters
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

**مهم جداً:**
- استبدل `username` و `password` و `host` بمعلومات قاعدة البيانات الخاصة بك
- أنشئ مفتاح JWT قوي (32 حرف على الأقل)
- ضع رابط الموقع الأمامي الصحيح

#### رفع Backend:
```bash
# على جهازك المحلي
cd backend
zip -r backend.zip . -x "node_modules/*" -x ".env"

# ارفع ملف backend.zip إلى السيرفر
# ثم على السيرفر:
unzip backend.zip -d ~/backend
cd ~/backend
npm install --production
```

#### تشغيل Backend باستخدام PM2:
```bash
npm install -g pm2
pm2 start server.js --name jenai-backend
pm2 save
pm2 startup
```

### 3. إعداد Frontend

#### تعديل ملف `package.json`:
قم بإزالة سطر `proxy` أو تحديثه ليشير إلى رابط Backend:
```json
{
  "proxy": "https://api.your-domain.com"
}
```

#### بناء Frontend:
```bash
cd frontend
npm install
npm run build
```

#### رفع Frontend:
1. ارفع محتويات مجلد `build` إلى مجلد `public_html` في السيرفر
2. تأكد من رفع جميع الملفات بما في ذلك:
   - index.html
   - static/
   - asset-manifest.json
   - manifest.json

### 4. إعداد Apache/Nginx

#### لـ Apache (.htaccess):
أنشئ ملف `.htaccess` في `public_html`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

#### لـ Nginx:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /api {
  proxy_pass http://localhost:5000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

### 5. إنشاء مستخدم Admin أولي

بعد تشغيل Backend، قم بإنشاء مستخدم مدير:

```bash
# اتصل بقاعدة البيانات
mongosh "mongodb://username:password@host:27017/cooperative-marketing"

# أنشئ مستخدم admin
db.users.insertOne({
  username: "admin",
  email: "admin@jenai-4u.com",
  password: "$2a$10$YourHashedPasswordHere",
  name: "المدير",
  role: "admin",
  isActive: true,
  createdAt: new Date()
})
```

**لإنشاء كلمة مرور مشفرة:**
```javascript
// على جهازك المحلي
const bcrypt = require('bcryptjs');
const password = 'YourStrongPassword123!';
const hashed = bcrypt.hashSync(password, 10);
console.log(hashed);
```

### 6. التحقق من التثبيت

1. تأكد من تشغيل Backend:
   ```bash
   pm2 status
   pm2 logs jenai-backend
   ```

2. اختبر API:
   ```bash
   curl https://api.your-domain.com/api/health
   ```

3. افتح الموقع في المتصفح:
   ```
   https://your-domain.com
   ```

### 7. الأمان

#### تأمين ملف .env:
```bash
chmod 600 ~/backend/.env
```

#### تفعيل SSL:
- استخدم Let's Encrypt للحصول على شهادة SSL مجانية
- في InterServer، يمكنك تفعيل SSL من لوحة التحكم

#### تحديث Firewall:
```bash
# السماح بالمنافذ المطلوبة فقط
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp  # للـ Backend
ufw enable
```

### 8. النسخ الاحتياطي

#### نسخ احتياطي تلقائي لقاعدة البيانات:
```bash
# أنشئ سكريبت للنسخ الاحتياطي
nano ~/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://username:password@host:27017/cooperative-marketing" --out="/backup/mongo_$DATE"
find /backup -name "mongo_*" -mtime +7 -exec rm -rf {} \;
```

```bash
chmod +x ~/backup-db.sh
# أضف إلى crontab للتشغيل اليومي
crontab -e
# أضف السطر التالي:
0 2 * * * /root/backup-db.sh
```

### 9. المراقبة

#### مراقبة Backend:
```bash
pm2 monit
pm2 logs jenai-backend --lines 100
```

#### مراقبة استخدام الموارد:
```bash
htop
df -h
```

### 10. استكشاف الأخطاء

#### إذا لم يعمل Backend:
```bash
pm2 logs jenai-backend --err
cd ~/backend
node server.js  # للتشغيل المباشر ورؤية الأخطاء
```

#### إذا لم يتصل Frontend بـ Backend:
1. تأكد من CORS في `backend/server.js`
2. تأكد من `FRONTEND_URL` في `.env`
3. افحص Network في أدوات المطور

#### إذا فشل الاتصال بقاعدة البيانات:
```bash
mongosh "mongodb://username:password@host:27017/cooperative-marketing"
# إذا نجح الاتصال، المشكلة في الكود
# إذا فشل، المشكلة في إعدادات MongoDB
```

## معلومات الاتصال للدعم

- **خدمة العملاء**: service@jenai-4u.com
- **الإدارة**: maneger@jenai-4u.com
- **الهاتف**: 00970598809058

---

## ملاحظات مهمة

1. **لا تنس** تغيير جميع كلمات المرور الافتراضية
2. **احتفظ** بنسخة من ملف `.env` في مكان آمن
3. **راجع** سجلات الأخطاء بانتظام
4. **حدّث** الاعتمادات (dependencies) دورياً لأسباب أمنية
5. **اختبر** جميع الوظائف بعد النشر
