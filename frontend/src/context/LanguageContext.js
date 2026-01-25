import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navbar
    home: 'Home',
    cart: 'Cart',
    dashboard: 'Dashboard',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',

    // Home Page
    heroTitle: 'Welcome to Our Store',
    heroSubtitle: 'Quality products at special prices for subscribers',
    searchPlaceholder: 'Search products...',
    allCategories: 'All Categories',
    noProducts: 'No products found',

    // Product Card
    outOfStock: 'Out of Stock',
    addToCart: 'Add to Cart',
    regularPrice: 'Regular Price',
    subscriberPrice: 'Member Price',
    memberPrice: 'Member Price',

    // Auth Pages
    loginTitle: 'Login to Your Account',
    registerTitle: 'Create an Account',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    referralCode: 'Referral Code',
    loginButton: 'Login',
    registerButton: 'Register',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signupHere: 'Sign up here',
    loginHere: 'Login here',

    // Account Types
    chooseAccountType: 'Choose Account Type',
    regularCustomer: 'Customer',
    regularCustomerDesc: 'Shop with regular prices - no membership code required',
    networkMember: 'Member',
    networkMemberDesc: 'Get special pricing and earn commissions - requires membership code',
    supplier: 'Supplier',
    supplierDesc: 'Provide wholesale products to the company',
    continueButton: 'Continue',
    backButton: 'Back',

    // Instructions Page
    instructionsTitle: 'Welcome to Network Marketing!',
    instructionsSubtitle: 'Learn how to maximize your earnings',
    instruction1Title: 'Shop with Special Prices',
    instruction1Text: 'As a member, you get access to exclusive member pricing on all products. Save money on every purchase!',
    instruction2Title: 'Share Your Referral Code',
    instruction2Text: 'Your unique referral code is the key to building your network. Share it with friends and family who want to join.',
    instruction3Title: 'Earn Commission on Sales',
    instruction3Text: 'When people in your network make purchases, you earn commissions:',
    commission1: 'Level 1 (Direct referrals): 10% commission',
    commission2: 'Level 2 (Their referrals): 5% commission',
    commission3: 'Level 3 (Next level): 3% commission',
    instruction4Title: 'Build Your Network',
    instruction4Text: 'The more people you refer, the more you earn. Help them succeed and your network will grow exponentially!',
    instruction5Title: 'Track Your Progress',
    instruction5Text: 'Visit your dashboard anytime to see your earnings, network size, and performance metrics.',
    instruction6Title: 'Tips for Success',
    tip1: 'Share your referral code on social media',
    tip2: 'Explain the benefits to potential members',
    tip3: 'Stay active and engaged with your network',
    tip4: 'Purchase regularly to show confidence in the products',
    getStartedButton: 'Get Started',
    footerNote: 'Questions? Contact our support team anytime.',

    // Cart Page
    cartTitle: 'Shopping Cart',
    emptyCart: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    remove: 'Remove',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    subscriberSavings: "You're saving with subscriber pricing!",

    // Dashboard
    dashboardTitle: 'Member Dashboard',
    welcomeBack: 'Welcome Back',
    totalEarnings: 'Total Earnings',
    networkSize: 'Network Size',
    directReferrals: 'Direct Referrals',
    yourReferralCode: 'Your Referral Code',
    copyCode: 'Copy Code',
    recentCommissions: 'Recent Commissions',

    // Admin
    adminTitle: 'Admin Dashboard',
    addProduct: 'Add Product',
    productName: 'Product Name',
    description: 'Description',
    category: 'Category',
    regularPriceLabel: 'Regular Price',
    subscriberPriceLabel: 'Member Price',
    memberPriceLabel: 'Member Price',
    stock: 'Stock',
    commissionRate: 'Commission Rate (%)',
    imageUrl: 'Image URL',
    saveProduct: 'Save Product',
    edit: 'Edit',
    delete: 'Delete',
  },
  ar: {
    // Navbar
    home: 'الرئيسية',
    cart: 'السلة',
    dashboard: 'لوحة التحكم',
    admin: 'الإدارة',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',

    // Home Page
    heroTitle: 'مرحباً بك في متجرنا',
    heroSubtitle: 'منتجات عالية الجودة بأسعار خاصة للمشتركين',
    searchPlaceholder: 'البحث عن المنتجات...',
    allCategories: 'جميع الفئات',
    noProducts: 'لم يتم العثور على منتجات',

    // Product Card
    outOfStock: 'نفذت الكمية',
    addToCart: 'أضف للسلة',
    regularPrice: 'السعر العادي',
    subscriberPrice: 'سعر العضو',
    memberPrice: 'سعر العضو',

    // Auth Pages
    loginTitle: 'تسجيل الدخول إلى حسابك',
    registerTitle: 'إنشاء حساب جديد',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    referralCode: 'كود الإحالة',
    loginButton: 'تسجيل الدخول',
    registerButton: 'تسجيل',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    signupHere: 'سجل هنا',
    loginHere: 'تسجيل الدخول هنا',

    // Account Types
    chooseAccountType: 'اختر نوع الحساب',
    regularCustomer: 'زبون',
    regularCustomerDesc: 'تسوق بالأسعار العادية - لا يحتاج كود عضوية',
    networkMember: 'عضو',
    networkMemberDesc: 'احصل على أسعار خاصة واكسب عمولات - يحتاج كود عضوية',
    supplier: 'مورد',
    supplierDesc: 'توريد منتجات بسعر الجملة للشركة',
    continueButton: 'متابعة',
    backButton: 'رجوع',

    // Instructions Page
    instructionsTitle: 'مرحباً بك في التسويق الشبكي!',
    instructionsSubtitle: 'تعلم كيف تزيد أرباحك',
    instruction1Title: 'تسوق بأسعار خاصة',
    instruction1Text: 'كعضو، تحصل على أسعار حصرية لجميع المنتجات. وفر المال في كل عملية شراء!',
    instruction2Title: 'شارك كود الإحالة الخاص بك',
    instruction2Text: 'كود الإحالة الفريد الخاص بك هو مفتاح بناء شبكتك. شاركه مع الأصدقاء والعائلة.',
    instruction3Title: 'اكسب عمولة على المبيعات',
    instruction3Text: 'عندما يقوم الأشخاص في شبكتك بإجراء عمليات شراء، تكسب عمولات:',
    commission1: 'المستوى 1 (إحالات مباشرة): عمولة 10%',
    commission2: 'المستوى 2 (إحالاتهم): عمولة 5%',
    commission3: 'المستوى 3 (المستوى التالي): عمولة 3%',
    instruction4Title: 'بناء شبكتك',
    instruction4Text: 'كلما زاد عدد الأشخاص الذين تحيلهم، زادت أرباحك. ساعدهم على النجاح وستنمو شبكتك بشكل كبير!',
    instruction5Title: 'تتبع تقدمك',
    instruction5Text: 'قم بزيارة لوحة التحكم في أي وقت لرؤية أرباحك وحجم شبكتك ومقاييس الأداء.',
    instruction6Title: 'نصائح للنجاح',
    tip1: 'شارك كود الإحالة على وسائل التواصل الاجتماعي',
    tip2: 'اشرح الفوائد للأعضاء المحتملين',
    tip3: 'ابق نشطاً ومتفاعلاً مع شبكتك',
    tip4: 'قم بالشراء بانتظام لإظهار الثقة في المنتجات',
    getStartedButton: 'ابدأ الآن',
    footerNote: 'هل لديك أسئلة؟ اتصل بفريق الدعم في أي وقت.',

    // Cart Page
    cartTitle: 'سلة التسوق',
    emptyCart: 'سلة التسوق فارغة',
    continueShopping: 'متابعة التسوق',
    total: 'المجموع',
    proceedToCheckout: 'إتمام الشراء',
    remove: 'حذف',
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    tax: 'الضريبة',
    subscriberSavings: 'أنت توفر مع أسعار الأعضاء!',

    // Dashboard
    dashboardTitle: 'لوحة تحكم العضو',
    welcomeBack: 'مرحباً بعودتك',
    totalEarnings: 'إجمالي الأرباح',
    networkSize: 'حجم الشبكة',
    directReferrals: 'الإحالات المباشرة',
    yourReferralCode: 'كود الإحالة الخاص بك',
    copyCode: 'نسخ الكود',
    recentCommissions: 'العمولات الأخيرة',

    // Admin
    adminTitle: 'لوحة تحكم الإدارة',
    addProduct: 'إضافة منتج',
    productName: 'اسم المنتج',
    description: 'الوصف',
    category: 'الفئة',
    regularPriceLabel: 'السعر العادي',
    subscriberPriceLabel: 'سعر العضو',
    memberPriceLabel: 'سعر العضو',
    stock: 'المخزون',
    commissionRate: 'نسبة العمولة (%)',
    imageUrl: 'رابط الصورة',
    saveProduct: 'حفظ المنتج',
    edit: 'تعديل',
    delete: 'حذف',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    // Keep direction constant (LTR) regardless of language
    document.documentElement.dir = 'ltr';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
