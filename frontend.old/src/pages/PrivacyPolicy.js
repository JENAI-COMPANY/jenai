import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/Policy.css';

gsap.registerPlugin(ScrollTrigger);

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const sectionsRef = useRef([]);

  useEffect(() => {
    sectionsRef.current.forEach((section, index) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: index * 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
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

  const content = {
    ar: {
      title: 'سياسة الخصوصية',
      intro: 'نلتزم في جيناي الفلسطينية بحماية خصوصية جميع مستخدمي الموقع.',
      dataCollection: {
        title: 'جمع البيانات',
        description: 'يتم جمع البيانات التالية فقط لأغراض محددة:',
        items: [
          { label: 'الاسم الكامل', purpose: 'للتعريف وإدارة الحساب' },
          { label: 'رقم الهاتف', purpose: 'للتواصل وإرسال الإشعارات' },
          { label: 'البريد الإلكتروني', purpose: 'للتواصل وإعادة تعيين كلمة المرور' },
          { label: 'العنوان', purpose: 'لتوصيل الطلبات' }
        ]
      },
      dataUsage: {
        title: 'استخدام البيانات',
        purposes: [
          'تقديم الخدمات المطلوبة',
          'إدارة العضوية والحسابات',
          'التواصل مع الأعضاء',
          'معالجة الطلبات والمدفوعات',
          'إرسال التحديثات والعروض (بموافقتك)',
          'تحسين جودة الخدمات'
        ]
      },
      dataProtection: {
        title: 'حماية البيانات',
        measures: [
          'استخدام تشفير SSL لجميع المعاملات',
          'تخزين البيانات في خوادم آمنة',
          'عدم مشاركة البيانات مع أطراف ثالثة دون موافقتك',
          'تحديث أنظمة الحماية باستمرار',
          'صلاحيات وصول محدودة للموظفين المختصين فقط'
        ]
      },
      userRights: {
        title: 'حقوقك',
        rights: [
          'الحق في الوصول إلى بياناتك الشخصية',
          'الحق في تعديل أو تحديث بياناتك',
          'الحق في حذف حسابك وبياناتك',
          'الحق في رفض تلقي الرسائل الترويجية',
          'الحق في معرفة كيفية استخدام بياناتك'
        ]
      },
      cookies: {
        title: 'ملفات تعريف الارتباط (Cookies)',
        description: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على الموقع، وتشمل:',
        types: [
          'ملفات ضرورية لتشغيل الموقع',
          'ملفات لتحسين الأداء وتحليل الاستخدام',
          'ملفات لحفظ تفضيلاتك'
        ],
        note: 'يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح، لكن قد يؤثر ذلك على بعض وظائف الموقع.'
      },
      thirdParty: {
        title: 'الأطراف الثالثة',
        description: 'لا نشارك بياناتك مع أي طرف ثالث إلا في الحالات التالية:',
        cases: [
          'بموافقتك الصريحة',
          'لتنفيذ خدماتنا (مثل شركات الشحن)',
          'عند الطلب القانوني من السلطات المختصة',
          'لحماية حقوق وسلامة الشركة والمستخدمين'
        ]
      },
      consent: {
        title: 'الموافقة',
        text: 'باستخدامك لهذا الموقع، فإنك توافق على سياسة الخصوصية الخاصة بنا. إذا كنت لا توافق، يرجى عدم استخدام الموقع.'
      },
      updates: {
        title: 'تحديثات السياسة',
        text: 'قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إعلامك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.'
      },
      contact: {
        title: 'للاستفسارات',
        description: 'إذا كان لديك أي استفسارات أو مخاوف بشأن سياسة الخصوصية، يرجى التواصل معنا.'
      }
    },
    en: {
      title: 'Privacy Policy',
      intro: 'At Jenai Palestine, we are committed to protecting the privacy of all website users.',
      dataCollection: {
        title: 'Data Collection',
        description: 'We collect the following data for specific purposes only:',
        items: [
          { label: 'Full Name', purpose: 'For identification and account management' },
          { label: 'Phone Number', purpose: 'For communication and sending notifications' },
          { label: 'Email Address', purpose: 'For communication and password reset' },
          { label: 'Address', purpose: 'For order delivery' }
        ]
      },
      dataUsage: {
        title: 'Data Usage',
        purposes: [
          'Providing requested services',
          'Managing memberships and accounts',
          'Communicating with members',
          'Processing orders and payments',
          'Sending updates and offers (with your consent)',
          'Improving service quality'
        ]
      },
      dataProtection: {
        title: 'Data Protection',
        measures: [
          'Using SSL encryption for all transactions',
          'Storing data on secure servers',
          'Not sharing data with third parties without your consent',
          'Continuously updating protection systems',
          'Limited access permissions for authorized personnel only'
        ]
      },
      userRights: {
        title: 'Your Rights',
        rights: [
          'Right to access your personal data',
          'Right to modify or update your data',
          'Right to delete your account and data',
          'Right to refuse promotional messages',
          'Right to know how your data is used'
        ]
      },
      cookies: {
        title: 'Cookies',
        description: 'We use cookies to improve your experience on the website, including:',
        types: [
          'Essential cookies for website operation',
          'Performance and analytics cookies',
          'Preference cookies to save your settings'
        ],
        note: 'You can disable cookies from your browser settings, but this may affect some website functions.'
      },
      thirdParty: {
        title: 'Third Parties',
        description: 'We do not share your data with any third party except in the following cases:',
        cases: [
          'With your explicit consent',
          'To execute our services (such as shipping companies)',
          'When legally required by competent authorities',
          'To protect the rights and safety of the company and users'
        ]
      },
      consent: {
        title: 'Consent',
        text: 'By using this website, you agree to our privacy policy. If you do not agree, please do not use the website.'
      },
      updates: {
        title: 'Policy Updates',
        text: 'We may update our privacy policy from time to time. You will be notified of any significant changes via email or website notification.'
      },
      contact: {
        title: 'For Inquiries',
        description: 'If you have any questions or concerns about our privacy policy, please contact us.'
      }
    }
  };

  const lang = content[language];

  return (
    <div className="policy-page">
      {/* Hero Section */}
      <div className="policy-hero" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{lang.title}</h1>
        </div>
      </div>

      <div className="policy-container">
        {/* Introduction */}
        <section className="policy-section" ref={addToRefs}>
          <div className="section-icon">🔒</div>
          <p className="intro-text">{lang.intro}</p>
        </section>

        {/* Data Collection */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.dataCollection.title}</h2>
          <p className="section-description">{lang.dataCollection.description}</p>
          <div className="data-collection-list">
            {lang.dataCollection.items.map((item, index) => (
              <div key={index} className="data-item">
                <div className="data-label">{item.label}</div>
                <div className="data-purpose">{item.purpose}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Usage */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.dataUsage.title}</h2>
          <div className="conditions-list">
            {lang.dataUsage.purposes.map((purpose, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">✓</div>
                <p>{purpose}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Protection */}
        <section className="policy-section" ref={addToRefs} style={{ background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)' }}>
          <h2 className="section-title">{lang.dataProtection.title}</h2>
          <div className="protection-grid">
            {lang.dataProtection.measures.map((measure, index) => (
              <div key={index} className="protection-card">
                <div className="protection-icon">🛡️</div>
                <p>{measure}</p>
              </div>
            ))}
          </div>
        </section>

        {/* User Rights */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.userRights.title}</h2>
          <div className="rights-list">
            {lang.userRights.rights.map((right, index) => (
              <div key={index} className="right-item">
                <div className="right-number">{index + 1}</div>
                <p>{right}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cookies */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.cookies.title}</h2>
          <p className="section-description">{lang.cookies.description}</p>
          <div className="cookies-list">
            {lang.cookies.types.map((type, index) => (
              <div key={index} className="cookie-item">
                <div className="cookie-icon">🍪</div>
                <p>{type}</p>
              </div>
            ))}
          </div>
          <div className="cookie-note">{lang.cookies.note}</div>
        </section>

        {/* Third Party */}
        <section className="policy-section warning-section" ref={addToRefs}>
          <h2 className="section-title">{lang.thirdParty.title}</h2>
          <p className="section-description">{lang.thirdParty.description}</p>
          <div className="warning-list">
            {lang.thirdParty.cases.map((item, index) => (
              <div key={index} className="warning-item">
                <div className="warning-icon">⚠</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Consent */}
        <section className="policy-section" ref={addToRefs} style={{ background: 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)', borderLeft: '5px solid #ff9800' }}>
          <h2 className="section-title">{lang.consent.title}</h2>
          <p className="consent-text">{lang.consent.text}</p>
        </section>

        {/* Updates */}
        <section className="policy-section" ref={addToRefs}>
          <div className="section-icon">📋</div>
          <h2 className="section-title">{lang.updates.title}</h2>
          <p className="section-description">{lang.updates.text}</p>
        </section>

        {/* Contact Section */}
        <section className="policy-section contact-section" ref={addToRefs}>
          <div className="section-icon">📞</div>
          <h2 className="section-title">{lang.contact.title}</h2>
          <p className="contact-text">{lang.contact.description}</p>
          <button
            className="contact-button"
            onClick={() => window.location.href = '/contact'}
          >
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
