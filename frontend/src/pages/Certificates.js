import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Certificates.css';

const Certificates = () => {
  const { language } = useLanguage();

  const certificates = [
    { image: '/images/certificates/cert1.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ١' : 'Company Registration Certificate 1' },
    { image: '/images/certificates/cert2.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ٢' : 'Company Registration Certificate 2' },
    { image: '/images/certificates/cert3.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ٣' : 'Company Registration Certificate 3' },
  ];

  return (
    <div className="cert-page" dir="rtl">
      {/* Hero */}
      <div className="cert-hero">
        <div className="cert-hero-overlay"></div>
        <div className="cert-hero-content">
          <h1>{language === 'ar' ? 'شهادات الشركة' : 'Company Certificates'}</h1>
          <p>{language === 'ar' ? 'الاعتمادات والشهادات الرسمية لشركة جيناي' : 'Official accreditations and certificates of Jenai Company'}</p>
        </div>
      </div>

      <div className="cert-page-body">

        {/* Certificates Grid */}
        <section className="cert-section">
          <h2 className="cert-section-title">
            <span className="cert-section-icon">📜</span>
            {language === 'ar' ? 'الشهادات الرسمية' : 'Official Certificates'}
          </h2>
          <div className="cert-grid">
            {certificates.map((cert, index) => (
              <div key={index} className="cert-card">
                <div className="cert-img-wrapper">
                  <img
                    src={cert.image}
                    alt={cert.name}
                    className="cert-img"
                    onClick={() => window.open(cert.image, '_blank')}
                  />
                  <div className="cert-img-overlay">
                    <span>🔍 {language === 'ar' ? 'عرض بالحجم الكامل' : 'View Full Size'}</span>
                  </div>
                </div>
                <p className="cert-card-name">{cert.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fatwa Section */}
        <section className="cert-section fatwa-section">
          <h2 className="cert-section-title">
            <span className="cert-section-icon">🕌</span>
            {language === 'ar' ? 'الفتوى الشرعية' : 'Islamic Legal Opinion'}
          </h2>

          <div className="fatwa-box">
            <div className="fatwa-box-header">
              <div className="fatwa-bismillah">بسم الله الرحمن الرحيم</div>
              <h3 className="fatwa-box-title">فتوى بخصوص شركة جيناي</h3>
            </div>

            <div className="fatwa-box-body">
              <p className="fatwa-intro">
                فإنه بخصوص السؤال الموجه لنا، والمتعلق بحكم العمل مع شركة جيناي، فإن العمل مع الشركة المذكورة
                بالتسويق، يجوز إذا تم الالتزام بالضوابط الآتية:
              </p>
              <ol className="fatwa-list">
                <li>أن لا يوجد اشتراك مالي لكسب العضوية.</li>
                <li>أن لا يوجد اشتراط شراء أي منتجات لكسب العضوية.</li>
                <li>أن لا يوجد شرط دفع اشتراك مالي لكسب أي ميّزات، كزيادة نقاط العضو وبرنامج ترقياته.</li>
                <li>أن لا يوجد شرط اشتراط شراء أي منتجات لكسب أي ميّزات، كزيادة نقاط العضو وبرنامج ترقياته.</li>
                <li>أن لا يوجد حد أدنى للنقاط شهريًا لاستحقاق عائد، أو لإمكانية سحبه.</li>
                <li>أن لا يوجد حد أدنى للنقاط شهريًا لزيادة نقاط العضو وبرنامج ترقياته.</li>
                <li>أن يتم ترصيد أي نقاط للعضو، وإمكانية سحبه لها في أي وقت، مهما كان حجمها، ودون أي قيود ولا حد أدنى.</li>
                <li>أن يتم البيان بتوضيح تام للعضو، عدد النقاط على كل منتج يبيعه، وقبل أن يبدأ العمل.</li>
                <li>أن يتم البيان بتوضيح تام للعضو، عدد النقاط على كل منتج في الطبقات التابعة له، التي ستدخل في حسابه، وذلك قبل أن يبدأ العمل.</li>
                <li>أن يتم البيان بتوضيح تام للعضو مسبقًا وقبل العمل، ما تعادله النقطة الواحدة من نقود، على كل منتج يبيعه.</li>
                <li>أن يتم البيان بتوضيح تام للعضو مسبقًا وقبل العمل، ما تعادله النقطة الواحدة من نقود على كل منتج يبيعه من هم تحته، وعند كل مستوى من مستويات البيع تحته.</li>
                <li>أن تكون المنتجات مفيدة وغير محرمة ومقصودًا شراؤها للناس في حياتهم اليومية.</li>
                <li>أن لا يقوم العضو –وبهدف تحقيق عمولات أو رتب أعلى– بشراء أي منتجات لنفسه لا يحتاجها حاجة استهلاكية حقيقية، أو بكميات لا يحتاجها حاجة حقيقية، أو بسعر أعلى من السوق لمثلها في المواصفات.</li>
              </ol>
            </div>

            <div className="fatwa-box-footer">
              <p className="fatwa-closing">والله الموفق وهو الهادي إلى سواء السبيل</p>
              <div className="fatwa-signature">
                <p className="fatwa-name">د. أيمن مصطفى الدَّبَّاغ</p>
                <p className="fatwa-title-text">رئيس قسم العلوم المالية الإسلامية، جامعة النجاح الوطنية</p>
                <p className="fatwa-location">رام الله، فلسطين</p>
                <p className="fatwa-date">18 / 6 / 2025</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Certificates;
