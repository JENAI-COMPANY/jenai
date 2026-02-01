import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/AboutUs.css';

const AboutUs = () => {
  const { t, language } = useLanguage();

  const content = {
    en: {
      title: 'About Jenai Company',
      vision: 'Our Vision',
      visionText: 'To be the leading network marketing company in the region, providing high-quality products and exceptional earning opportunities for our members.',
      mission: 'Our Mission',
      missionText: 'We strive to empower individuals through network marketing, offering them the tools and support needed to build successful businesses while enjoying premium products at competitive prices.',
      values: 'Our Values',
      valuesList: [
        { title: 'Quality', text: 'We never compromise on product quality and customer satisfaction.' },
        { title: 'Integrity', text: 'We conduct our business with honesty, transparency, and ethical practices.' },
        { title: 'Empowerment', text: 'We believe in empowering our members to achieve financial independence.' },
        { title: 'Innovation', text: 'We continuously innovate to provide better products and services.' },
        { title: 'Community', text: 'We build strong communities based on mutual support and success.' }
      ],
      services: 'Our Services',
      servicesList: [
        { title: 'Premium Products', text: 'High-quality products at special prices for members.' },
        { title: 'Network Marketing', text: 'Comprehensive network marketing system with attractive commission structure.' },
        { title: 'Training & Support', text: 'Continuous training and support through Jenai Academy.' },
        { title: 'Easy Shopping', text: 'User-friendly online platform with secure payment options.' }
      ],
      achievements: 'Our Achievements',
      achievementsList: [
        'Serving thousands of satisfied customers',
        'Building a network of successful entrepreneurs',
        'Offering hundreds of premium products',
        'Creating employment opportunities across the region'
      ],
      contactUs: 'Contact Us',
      contactText: 'Have questions? Our team is here to help you succeed!'
    },
    ar: {
      title: 'عن شركة جيناي',
      vision: 'رؤيتنا',
      visionText: 'أن نكون الشركة الرائدة في التسويق الشبكي في المنطقة، نقدم منتجات عالية الجودة وفرص ربح استثنائية لأعضائنا.',
      mission: 'رسالتنا',
      missionText: 'نسعى لتمكين الأفراد من خلال التسويق الشبكي، ونوفر لهم الأدوات والدعم اللازم لبناء أعمال ناجحة مع الاستمتاع بمنتجات عالية الجودة بأسعار تنافسية.',
      values: 'قيمنا',
      valuesList: [
        { title: 'الجودة', text: 'لا نتنازل أبداً عن جودة المنتجات ورضا العملاء.' },
        { title: 'النزاهة', text: 'نمارس أعمالنا بصدق وشفافية وأخلاقيات عالية.' },
        { title: 'التمكين', text: 'نؤمن بتمكين أعضائنا لتحقيق الاستقلال المالي.' },
        { title: 'الابتكار', text: 'نبتكر باستمرار لتقديم منتجات وخدمات أفضل.' },
        { title: 'المجتمع', text: 'نبني مجتمعات قوية قائمة على الدعم المتبادل والنجاح.' }
      ],
      services: 'خدماتنا',
      servicesList: [
        { title: 'منتجات ممتازة', text: 'منتجات عالية الجودة بأسعار خاصة للأعضاء.' },
        { title: 'التسويق الشبكي', text: 'نظام تسويق شبكي شامل مع هيكل عمولات جذاب.' },
        { title: 'التدريب والدعم', text: 'تدريب ودعم مستمر من خلال أكاديمية جيناي.' },
        { title: 'التسوق السهل', text: 'منصة إلكترونية سهلة الاستخدام مع خيارات دفع آمنة.' }
      ],
      achievements: 'إنجازاتنا',
      achievementsList: [
        'خدمة آلاف العملاء الراضين',
        'بناء شبكة من رواد الأعمال الناجحين',
        'تقديم مئات المنتجات الممتازة',
        'خلق فرص عمل في جميع أنحاء المنطقة'
      ],
      contactUs: 'اتصل بنا',
      contactText: 'هل لديك أسئلة؟ فريقنا هنا لمساعدتك على النجاح!'
    }
  };

  const lang = content[language];

  return (
    <div className="about-us-container">
      <div className="about-hero">
        <h1>{lang.title}</h1>
      </div>

      <div className="about-content">
        {/* Vision Section */}
        <section className="about-section vision-section">
          <div className="section-icon">🎯</div>
          <h2>{lang.vision}</h2>
          <p>{lang.visionText}</p>
        </section>

        {/* Mission Section */}
        <section className="about-section mission-section">
          <div className="section-icon">🚀</div>
          <h2>{lang.mission}</h2>
          <p>{lang.missionText}</p>
        </section>

        {/* Values Section */}
        <section className="about-section values-section">
          <div className="section-icon">⭐</div>
          <h2>{lang.values}</h2>
          <div className="values-grid">
            {lang.valuesList.map((value, index) => (
              <div key={index} className="value-card">
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="about-section services-section">
          <div className="section-icon">💼</div>
          <h2>{lang.services}</h2>
          <div className="services-grid">
            {lang.servicesList.map((service, index) => (
              <div key={index} className="service-card">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="about-section achievements-section">
          <div className="section-icon">🏆</div>
          <h2>{lang.achievements}</h2>
          <ul className="achievements-list">
            {lang.achievementsList.map((achievement, index) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        </section>

        {/* Contact Section */}
        <section className="about-section contact-section">
          <div className="section-icon">📞</div>
          <h2>{lang.contactUs}</h2>
          <p>{lang.contactText}</p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
