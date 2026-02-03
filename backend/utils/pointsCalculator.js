/**
 * نظام احتساب النقاط والأرباح لأعضاء جيناي
 *
 * طريقتان لاحتساب النقاط:
 * 1. الأداء الشخصي: من مشتريات العضو نفسه
 * 2. أداء الأجيال: من مشتريات الأجيال الخمسة تحته
 */

/**
 * حساب نقاط الأداء الشخصي
 * النقاط = (سعر الجملة - سعر العضو) × الكمية × 1.5
 *
 * @param {Number} wholesalePrice - سعر الجملة
 * @param {Number} memberPrice - سعر العضو
 * @param {Number} quantity - الكمية
 * @returns {Number} عدد النقاط
 */
const calculatePersonalPerformancePoints = (wholesalePrice, memberPrice, quantity) => {
  const priceGap = wholesalePrice - memberPrice;
  const points = priceGap * quantity * 1.5;
  return Math.floor(points); // نزيل الكسور العشرية
};

/**
 * نسب عمولات الأجيال الخمسة
 */
const GENERATION_COMMISSION_RATES = {
  personal: 0.20,      // 20% عمولة الأداء الشخصي
  generation1: 0.11,   // 11% الجيل الأول
  generation2: 0.08,   // 8% الجيل الثاني
  generation3: 0.06,   // 6% الجيل الثالث
  generation4: 0.03,   // 3% الجيل الرابع
  generation5: 0.02    // 2% الجيل الخامس
};

/**
 * معامل التحويل من النقاط إلى الشيكل
 */
const POINTS_TO_SHEKEL_RATE = 0.55;

/**
 * حساب العمولة من نقاط جيل معين
 *
 * @param {Number} generationPoints - مجموع نقاط الجيل
 * @param {Number} generationLevel - رقم الجيل (1-5)
 * @returns {Number} نقاط العمولة
 */
const calculateGenerationCommission = (generationPoints, generationLevel) => {
  const rateKey = generationLevel === 0 ? 'personal' : `generation${generationLevel}`;
  const rate = GENERATION_COMMISSION_RATES[rateKey];

  if (!rate) return 0;

  return generationPoints * rate;
};

/**
 * حساب إجمالي الأرباح بالشيكل من مجموع النقاط
 *
 * @param {Number} totalPoints - مجموع النقاط (شخصي + أجيال)
 * @returns {Number} المبلغ بالشيكل
 */
const calculateProfitInShekel = (totalPoints) => {
  return Math.floor(totalPoints * POINTS_TO_SHEKEL_RATE);
};

/**
 * حساب النقاط الإجمالية للعضو
 *
 * @param {Object} memberData - بيانات العضو
 * @param {Number} memberData.personalPoints - نقاط الأداء الشخصي
 * @param {Array} memberData.generationsPoints - مصفوفة نقاط الأجيال [جيل1, جيل2, جيل3, جيل4, جيل5]
 * @returns {Object} تفاصيل النقاط والأرباح
 */
const calculateTotalPoints = (memberData) => {
  const { personalPoints = 0, generationsPoints = [0, 0, 0, 0, 0] } = memberData;

  // حساب عمولة الأداء الشخصي (20%)
  const personalCommissionPoints = calculateGenerationCommission(personalPoints, 0);

  // حساب عمولات الأجيال
  const generationsCommissionPoints = generationsPoints.map((points, index) => {
    return calculateGenerationCommission(points, index + 1);
  });

  // مجموع نقاط العمولات
  const totalCommissionPoints = personalCommissionPoints +
    generationsCommissionPoints.reduce((sum, points) => sum + points, 0);

  // المبلغ بالشيكل
  const profitInShekel = calculateProfitInShekel(totalCommissionPoints);

  return {
    personalPoints,
    personalCommissionPoints,
    generationsPoints,
    generationsCommissionPoints,
    totalCommissionPoints,
    profitInShekel,
    breakdown: {
      personal: {
        points: personalPoints,
        commission: personalCommissionPoints,
        rate: GENERATION_COMMISSION_RATES.personal
      },
      generation1: {
        points: generationsPoints[0] || 0,
        commission: generationsCommissionPoints[0] || 0,
        rate: GENERATION_COMMISSION_RATES.generation1
      },
      generation2: {
        points: generationsPoints[1] || 0,
        commission: generationsCommissionPoints[1] || 0,
        rate: GENERATION_COMMISSION_RATES.generation2
      },
      generation3: {
        points: generationsPoints[2] || 0,
        commission: generationsCommissionPoints[2] || 0,
        rate: GENERATION_COMMISSION_RATES.generation3
      },
      generation4: {
        points: generationsPoints[3] || 0,
        commission: generationsCommissionPoints[3] || 0,
        rate: GENERATION_COMMISSION_RATES.generation4
      },
      generation5: {
        points: generationsPoints[4] || 0,
        commission: generationsCommissionPoints[4] || 0,
        rate: GENERATION_COMMISSION_RATES.generation5
      }
    }
  };
};

/**
 * حساب نقاط الطلب للعضو
 *
 * @param {Array} orderItems - عناصر الطلب
 * @param {Array} products - بيانات المنتجات
 * @returns {Number} إجمالي النقاط
 */
const calculateOrderPoints = (orderItems, products) => {
  let totalPoints = 0;

  for (const item of orderItems) {
    const product = products.find(p => p._id.toString() === item.product.toString());

    if (product && product.wholesalePrice && product.memberPrice) {
      const points = calculatePersonalPerformancePoints(
        product.wholesalePrice,
        product.memberPrice,
        item.quantity
      );
      totalPoints += points;
    }
  }

  return totalPoints;
};

module.exports = {
  calculatePersonalPerformancePoints,
  calculateGenerationCommission,
  calculateProfitInShekel,
  calculateTotalPoints,
  calculateOrderPoints,
  GENERATION_COMMISSION_RATES,
  POINTS_TO_SHEKEL_RATE
};
