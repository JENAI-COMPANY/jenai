import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CallToAction from '../components/CallToAction';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/About.css';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const { language } = useLanguage();
  const heroRef = useRef(null);
  const sectionsRef = useRef([]);

  useEffect(() => {
    // Hero animation
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    // Section animations
    sectionsRef.current.forEach((section, index) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const achievements2025 = [
    {
      icon: '🏆',
      title: language === 'ar' ? 'توسع عالمي' : 'Global Expansion',
      description: language === 'ar'
        ? 'افتتاح 15 فرع جديد في 8 دول'
        : 'Opened 15 new branches across 8 countries'
    },
    {
      icon: '👥',
      title: language === 'ar' ? 'نمو الأعضاء' : 'Member Growth',
      description: language === 'ar'
        ? 'انضمام أكثر من 50,000 عضو جديد'
        : 'Over 50,000 new members joined'
    },
    {
      icon: '💰',
      title: language === 'ar' ? 'العمولات المدفوعة' : 'Commissions Paid',
      description: language === 'ar'
        ? 'دفع أكثر من 5 مليون دولار عمولات'
        : 'Paid over $5 million in commissions'
    },
    {
      icon: '📦',
      title: language === 'ar' ? 'المنتجات المباعة' : 'Products Sold',
      description: language === 'ar'
        ? 'بيع أكثر من 200,000 منتج'
        : 'Sold over 200,000 products'
    }
  ];

  const certificates = [
    { image: '/images/certificates/cert1.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ١' : 'Company Registration Certificate 1' },
    { image: '/images/certificates/cert2.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ٢' : 'Company Registration Certificate 2' },
    { image: '/images/certificates/cert3.jpg', name: language === 'ar' ? 'شهادة تسجيل الشركة ٣' : 'Company Registration Certificate 3' },
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero" ref={heroRef}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            {language === 'ar' ? 'من نحن' : 'About Us'}
          </h1>
          <p className="hero-subtitle">
            {language === 'ar'
              ? 'رؤية واضحة لمستقبل مشرق'
              : 'A Clear Vision for a Bright Future'}
          </p>
        </div>
      </div>

      <div className="about-container">
        {/* About Us Section - January 2026 */}
        <section className="about-section" ref={addToRefs}>
          <div className="section-icon">🌟</div>
          <h2 className="section-title">
            {language === 'ar' ? 'من نحن' : 'About Us'}
          </h2>
          <p className="section-text">
            {language === 'ar'
              ? 'جيناي الفلسطينية هي شركة وطنية وعالمية رائدة في مجال البيع المباشر والتسويق التعاوني، وُجدت لتكون أكثر من مجرد منصة بيع، بل فرصة حقيقية لكل من يبحث عن دخل كريم، وانتماء، ونمو شخصي ومهني.'
              : 'Jenai Palestine is a leading national and global company in direct sales and cooperative marketing, created to be more than just a sales platform, but a real opportunity for anyone seeking a decent income, belonging, and personal and professional growth.'}
          </p>
          <p className="section-text">
            {language === 'ar'
              ? 'انطلقت جيناي من الإيمان العميق بقدرة الإنسان الفلسطيني – خاصة النساء والشباب – على بناء مستقبل أفضل من خلال العمل، الشراكة، ودعم المنتج الوطني.'
              : 'Jenai was launched from a deep belief in the ability of the Palestinian people - especially women and youth - to build a better future through work, partnership, and supporting national products.'}
          </p>
          <p className="section-text" style={{ fontWeight: 'bold', fontSize: '1.1em', marginTop: '1.5rem' }}>
            {language === 'ar'
              ? 'نحن لا نبيع منتجات فقط، نحن نبني مجتمعاً متعاونًا، وعائلة هدفها النجاح ونصنع قصص نجاح حقيقية، ونفتح أبواب الفرص بلا حدود.'
              : 'We don\'t just sell products, we build a cooperative community, a family whose goal is success, we create real success stories, and we open doors of unlimited opportunities.'}
          </p>
          <p className="section-text" style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2em', marginTop: '1rem' }}>
            {language === 'ar'
              ? 'جيناي فرص بلا حدود / من قلب فلسطين إلى كل العالم'
              : 'Jenai - Unlimited Opportunities / From the Heart of Palestine to the Whole World'}
          </p>
        </section>

        {/* Vision Section */}
        <section className="about-section" ref={addToRefs}>
          <div className="section-icon">🎯</div>
          <h2 className="section-title">
            {language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
          </h2>
          <p className="section-text">
            {language === 'ar'
              ? 'أن تكون جيناي الفلسطينية منصة وطنية رائدة، تدعم المنتج الفلسطيني، وتمكّن الأفراد من تحقيق الاستقلال المالي وبناء فرق ناجحة داخل فلسطين وخارجها.'
              : 'To be a leading national platform for Jenai Palestine, supporting Palestinian products, and empowering individuals to achieve financial independence and build successful teams inside and outside Palestine.'}
          </p>
        </section>

        {/* Mission Section */}
        <section className="about-section" ref={addToRefs}>
          <div className="section-icon">🚀</div>
          <h2 className="section-title">
            {language === 'ar' ? 'مهمتنا' : 'Our Mission'}
          </h2>
          <p className="section-text">
            {language === 'ar'
              ? 'تمكين الأفراد من بناء أعمالهم الخاصة من خلال نظام تسويق شبكي عادل وشفاف، مع تقديم منتجات استثنائية وخدمة عملاء متميزة ودعم مستمر لنجاح أعضائنا.'
              : 'Empowering individuals to build their own businesses through a fair and transparent network marketing system, while providing exceptional products, outstanding customer service, and continuous support for our members\' success.'}
          </p>
        </section>

        {/* Values Section */}
        <section className="about-section" ref={addToRefs}>
          <div className="section-icon">💎</div>
          <h2 className="section-title">
            {language === 'ar' ? 'قيمنا' : 'Our Values'}
          </h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>{language === 'ar' ? 'النزاهة' : 'Integrity'}</h3>
              <p>
                {language === 'ar'
                  ? 'نعمل بشفافية وصدق مع جميع أعضائنا وعملائنا'
                  : 'We operate with transparency and honesty with all our members and customers'}
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">⭐</div>
              <h3>{language === 'ar' ? 'التميز' : 'Excellence'}</h3>
              <p>
                {language === 'ar'
                  ? 'نسعى دائماً لتقديم أفضل المنتجات والخدمات'
                  : 'We always strive to deliver the best products and services'}
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>{language === 'ar' ? 'النمو' : 'Growth'}</h3>
              <p>
                {language === 'ar'
                  ? 'نؤمن بالتطور المستمر والتعلم الدائم'
                  : 'We believe in continuous development and lifelong learning'}
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤗</div>
              <h3>{language === 'ar' ? 'المجتمع' : 'Community'}</h3>
              <p>
                {language === 'ar'
                  ? 'نبني مجتمعاً قوياً يدعم بعضه البعض'
                  : 'We build a strong community that supports each other'}
              </p>
            </div>
          </div>
        </section>

        {/* Why Jenai Section */}
        <section className="about-section why-jenai-section" ref={addToRefs}>
          <div className="section-icon">💡</div>
          <h2 className="section-title">
            {language === 'ar' ? 'لماذا جيناي؟' : 'Why Jenai?'}
          </h2>
          <div className="why-jenai-grid">
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'دعم حقيقي للمنتج الوطني' : 'Real support for national products'}</p>
            </div>
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'نظام واضح وشفاف للنقاط والأرباح' : 'Clear and transparent points and profit system'}</p>
            </div>
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'فرصة عمل بدون رأس مال' : 'Business opportunity without capital'}</p>
            </div>
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'بيئة تحفيزية قائمة على التعاون لا المنافسة' : 'Motivational environment based on cooperation, not competition'}</p>
            </div>
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'أكاديمية تدريبية لتطوير المهارات' : 'Training academy for skill development'}</p>
            </div>
            <div className="why-jenai-card">
              <div className="check-icon">✔</div>
              <p>{language === 'ar' ? 'شركة تُدار بقيم، لا بشعارات' : 'A company managed by values, not slogans'}</p>
            </div>
          </div>
          <p className="why-jenai-slogan">
            {language === 'ar' ? 'جيناي… فرص بلا حدود' : 'Jenai... Unlimited Opportunities'}
          </p>
        </section>


        {/* Certificates */}
        <section className="about-section certificates-section" ref={addToRefs}>
          <h2 className="section-title">
            {language === 'ar' ? 'شهاداتنا' : 'Our Certificates'}
          </h2>
          <div className="certificates-grid">
            {certificates.map((cert, index) => (
              <div key={index} className="certificate-card">
                <div className="certificate-image-wrapper">
                  <img
                    src={cert.image}
                    alt={cert.name}
                    className="certificate-image"
                    onClick={() => window.open(cert.image, '_blank')}
                  />
                </div>
                <h3 className="certificate-name">{cert.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="about-section services-section" ref={addToRefs}>
          <h2 className="section-title">
            {language === 'ar' ? 'خدماتنا' : 'Our Services'}
          </h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🛍️</div>
              <h3>{language === 'ar' ? 'التجارة الإلكترونية' : 'E-Commerce'}</h3>
              <p>
                {language === 'ar'
                  ? 'منصة تسوق متكاملة بمنتجات عالية الجودة'
                  : 'Complete shopping platform with high-quality products'}
              </p>
            </div>
            <div className="service-card">
              <div className="service-icon">📈</div>
              <h3>{language === 'ar' ? 'التسويق التعاوني' : 'Cooperative Marketing'}</h3>
              <p>
                {language === 'ar'
                  ? 'فرصة لبناء دخل مستدام من خلال فريقك'
                  : 'Opportunity to build sustainable income through your team'}
              </p>
            </div>
            <div className="service-card">
              <div className="service-icon">🎓</div>
              <h3>{language === 'ar' ? 'أكاديمية التدريب' : 'Training Academy'}</h3>
              <p>
                {language === 'ar'
                  ? 'دورات تدريبية مجانية لتطوير مهاراتك'
                  : 'Free training courses to develop your skills'}
              </p>
            </div>
            <div className="service-card">
              <div className="service-icon">💼</div>
              <h3>{language === 'ar' ? 'الدعم المستمر' : 'Ongoing Support'}</h3>
              <p>
                {language === 'ar'
                  ? 'فريق دعم متاح 24/7 لمساعدتك'
                  : '24/7 support team available to help you'}
              </p>
            </div>
          </div>
        </section>

        {/* Fatwa Section */}
        <section className="about-section fatwa-section" ref={addToRefs}>
          <h2 className="section-title">
            {language === 'ar' ? 'الفتوى الشرعية' : 'Islamic Legal Opinion'}
          </h2>
          <div className="fatwa-container">
            <div className="fatwa-header">
              <div className="fatwa-bismillah">بسم الله الرحمن الرحيم</div>
              <h3 className="fatwa-title">فتوى بخصوص شركة جيناي</h3>
            </div>
            <div className="fatwa-body">
              <p className="fatwa-intro">
                فإنه بخصوص السؤال الموجه لنا، والمتعلق بحكم العمل مع شركة جيناي، فإن العمل مع الشركة المذكورة بالتسويق، يجوز إذا تم الالتزام بالضوابط الآتية:
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
            <div className="fatwa-footer">
              <p className="fatwa-closing">والله الموفق وهو الهادي إلى سواء السبيل</p>
              <div className="fatwa-signature">
                <p className="fatwa-scholar-name">د. أيمن مصطفى الدَّبَّاغ</p>
                <p className="fatwa-scholar-title">رئيس قسم العلوم المالية الإسلامية، جامعة النجاح الوطنية</p>
                <p className="fatwa-scholar-location">رام الله، فلسطين</p>
                <p className="fatwa-date">18 / 6 / 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <CallToAction variant="detailed" />
      </div>
    </div>
  );
};

export default About;
