import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/Policy.css';

gsap.registerPlugin(ScrollTrigger);

const TermsConditions = () => {
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
      title: 'الشروط والأحكام',
      intro: 'مرحباً بك في جيناي الفلسطينية. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بالشروط والأحكام التالية.',
      registration: {
        title: 'التسجيل والعضوية',
        items: [
          'التسجيل في جيناي متاح للأفراد البالغين (18 عاماً فما فوق)',
          'يجب تقديم معلومات صحيحة ودقيقة عند التسجيل',
          'يلتزم العضو بتحديث معلوماته بشكل دوري',
          'لكل عضو حساب واحد فقط على المنصة',
          'يجب الحفاظ على سرية بيانات الدخول الخاصة بك'
        ]
      },
      usage: {
        title: 'استخدام المنصة',
        rules: [
          'استخدام المنصة للأغراض المشروعة فقط',
          'عدم محاولة اختراق أو التلاعب بالنظام',
          'عدم استخدام المنصة لأنشطة احتيالية أو غير قانونية',
          'احترام حقوق الملكية الفكرية للشركة',
          'عدم مشاركة محتوى مسيء أو غير لائق',
          'الالتزام بقواعد السلوك المهني في التعامل'
        ]
      },
      violations: {
        title: 'العقوبات عند المخالفة',
        description: 'أي محاولة تلاعب بالنظام أو استغلال غير مشروع تؤدي إلى:',
        consequences: [
          { icon: '⚠️', text: 'تحذير رسمي من الإدارة' },
          { icon: '⏸️', text: 'إيقاف مؤقت للعضوية' },
          { icon: '🚫', text: 'إيقاف دائم للحساب' },
          { icon: '💰', text: 'حجب الأرباح والعمولات' },
          { icon: '⚖️', text: 'اتخاذ الإجراءات القانونية عند الضرورة' }
        ]
      },
      commissions: {
        title: 'العمولات والأرباح',
        items: [
          'تُحسب العمولات وفقاً لنظام التسويق التعاوني المعتمد',
          'يتم دفع العمولات حسب الجدول الزمني المحدد',
          'الحد الأدنى للسحب يتم تحديده من قبل الإدارة',
          'تحتفظ الشركة بحق مراجعة العمليات المشبوهة',
          'أي عمولات ناتجة عن أنشطة مخالفة تُلغى تلقائياً'
        ]
      },
      companyRights: {
        title: 'حقوق الشركة',
        rights: [
          'تعديل الأنظمة والسياسات بما يخدم مصلحة الجميع',
          'تطوير وتحديث السيستم والخدمات',
          'تحديث الشروط والأحكام عند الحاجة',
          'إيقاف أو إلغاء أي حساب يخالف الشروط',
          'رفض أي طلب انضمام دون إبداء الأسباب',
          'إنهاء الخدمة لأي عضو في حالة المخالفة الجسيمة'
        ]
      },
      products: {
        title: 'المنتجات والطلبات',
        items: [
          'جميع المنتجات خاضعة للتوفر',
          'الأسعار قابلة للتغيير دون إشعار مسبق',
          'تُطبق سياسة الإرجاع المعتمدة على جميع المنتجات',
          'الشركة غير مسؤولة عن التأخير في التوصيل بسبب ظروف خارجة عن إرادتها',
          'يجب فحص المنتجات عند الاستلام والإبلاغ عن أي مشاكل فوراً'
        ]
      },
      liability: {
        title: 'المسؤولية وإخلاء المسؤولية',
        items: [
          'الشركة غير مسؤولة عن أي خسائر ناتجة عن سوء استخدام المنصة',
          'المستخدم مسؤول بالكامل عن أمان حسابه وبياناته',
          'الشركة لا تضمن استمرارية الخدمة دون انقطاع',
          'لا تتحمل الشركة مسؤولية المحتوى الذي ينشره المستخدمون',
          'في حالة النزاع، القوانين الفلسطينية هي المرجع'
        ]
      },
      termination: {
        title: 'إنهاء الحساب',
        description: 'يمكن إنهاء الحساب في الحالات التالية:',
        cases: [
          'بطلب من العضو نفسه',
          'عند مخالفة الشروط والأحكام',
          'في حالة عدم النشاط لمدة تزيد عن سنة',
          'عند اكتشاف معلومات مزيفة أو احتيالية',
          'لأسباب أمنية أو قانونية'
        ]
      },
      agreement: {
        title: 'الموافقة على الشروط',
        text: 'الاستمرار في استخدام المنصة يعني الموافقة الكاملة على هذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.'
      },
      updates: {
        title: 'تحديث الشروط',
        text: 'تحتفظ جيناي بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار الأعضاء بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.'
      },
      contact: {
        title: 'للاستفسارات',
        description: 'لأي استفسارات حول الشروط والأحكام، يرجى التواصل مع فريق الدعم.'
      }
    },
    en: {
      title: 'Terms and Conditions',
      intro: 'Welcome to Jenai Palestine. By using this platform, you agree to comply with the following terms and conditions.',
      registration: {
        title: 'Registration and Membership',
        items: [
          'Registration in Jenai is available for adults (18 years and above)',
          'Accurate and correct information must be provided during registration',
          'Members must update their information periodically',
          'Each member is allowed only one account on the platform',
          'You must maintain the confidentiality of your login credentials'
        ]
      },
      usage: {
        title: 'Platform Usage',
        rules: [
          'Use the platform for lawful purposes only',
          'Do not attempt to hack or manipulate the system',
          'Do not use the platform for fraudulent or illegal activities',
          'Respect the company\'s intellectual property rights',
          'Do not share offensive or inappropriate content',
          'Adhere to professional conduct standards in interactions'
        ]
      },
      violations: {
        title: 'Penalties for Violations',
        description: 'Any attempt to manipulate the system or unlawful exploitation will lead to:',
        consequences: [
          { icon: '⚠️', text: 'Official warning from management' },
          { icon: '⏸️', text: 'Temporary suspension of membership' },
          { icon: '🚫', text: 'Permanent account suspension' },
          { icon: '💰', text: 'Withholding profits and commissions' },
          { icon: '⚖️', text: 'Legal action when necessary' }
        ]
      },
      commissions: {
        title: 'Commissions and Profits',
        items: [
          'Commissions are calculated according to the approved cooperative marketing system',
          'Commissions are paid according to the specified schedule',
          'Minimum withdrawal amount is determined by management',
          'The company reserves the right to review suspicious transactions',
          'Any commissions resulting from violating activities are automatically cancelled'
        ]
      },
      companyRights: {
        title: 'Company Rights',
        rights: [
          'Modify systems and policies to serve everyone\'s interest',
          'Develop and update the system and services',
          'Update terms and conditions when necessary',
          'Suspend or cancel any account that violates the terms',
          'Reject any membership application without stating reasons',
          'Terminate service for any member in case of serious violation'
        ]
      },
      products: {
        title: 'Products and Orders',
        items: [
          'All products are subject to availability',
          'Prices are subject to change without prior notice',
          'The approved return policy applies to all products',
          'The company is not responsible for delivery delays due to circumstances beyond its control',
          'Products must be inspected upon receipt and any problems reported immediately'
        ]
      },
      liability: {
        title: 'Liability and Disclaimer',
        items: [
          'The company is not responsible for any losses resulting from platform misuse',
          'Users are fully responsible for their account and data security',
          'The company does not guarantee uninterrupted service',
          'The company is not responsible for user-generated content',
          'In case of dispute, Palestinian laws are the reference'
        ]
      },
      termination: {
        title: 'Account Termination',
        description: 'Accounts can be terminated in the following cases:',
        cases: [
          'At the member\'s own request',
          'Upon violation of terms and conditions',
          'In case of inactivity for more than one year',
          'Upon discovery of fake or fraudulent information',
          'For security or legal reasons'
        ]
      },
      agreement: {
        title: 'Agreement to Terms',
        text: 'Continued use of the platform means full agreement to these terms and conditions. If you do not agree with any of these terms, please do not use the platform.'
      },
      updates: {
        title: 'Terms Updates',
        text: 'Jenai reserves the right to modify these terms and conditions at any time. Members will be notified of any significant changes via email or platform notification.'
      },
      contact: {
        title: 'For Inquiries',
        description: 'For any inquiries about the terms and conditions, please contact our support team.'
      }
    }
  };

  const lang = content[language];

  return (
    <div className="policy-page">
      {/* Hero Section */}
      <div className="policy-hero" style={{ background: 'linear-gradient(135deg, #8e44ad 0%, #c0392b 100%)' }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{lang.title}</h1>
        </div>
      </div>

      <div className="policy-container">
        {/* Introduction */}
        <section className="policy-section" ref={addToRefs}>
          <div className="section-icon">📜</div>
          <p className="intro-text">{lang.intro}</p>
        </section>

        {/* Registration */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.registration.title}</h2>
          <div className="conditions-list">
            {lang.registration.items.map((item, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">✓</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Usage */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.usage.title}</h2>
          <div className="conditions-list">
            {lang.usage.rules.map((rule, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">✓</div>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Violations */}
        <section className="policy-section warning-section" ref={addToRefs}>
          <h2 className="section-title">{lang.violations.title}</h2>
          <p className="section-description">{lang.violations.description}</p>
          <div className="violations-grid">
            {lang.violations.consequences.map((item, index) => (
              <div key={index} className="violation-card">
                <div className="violation-icon">{item.icon}</div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commissions */}
        <section className="policy-section" ref={addToRefs} style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
          <h2 className="section-title">{lang.commissions.title}</h2>
          <div className="conditions-list">
            {lang.commissions.items.map((item, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">💰</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Rights */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.companyRights.title}</h2>
          <div className="rights-list">
            {lang.companyRights.rights.map((right, index) => (
              <div key={index} className="right-item">
                <div className="right-number">{index + 1}</div>
                <p>{right}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products and Orders */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.products.title}</h2>
          <div className="conditions-list">
            {lang.products.items.map((item, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">📦</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Liability */}
        <section className="policy-section" ref={addToRefs} style={{ background: 'linear-gradient(135deg, #fff9e6 0%, #ffecb3 100%)' }}>
          <h2 className="section-title">{lang.liability.title}</h2>
          <div className="conditions-list">
            {lang.liability.items.map((item, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">⚠</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Account Termination */}
        <section className="policy-section warning-section" ref={addToRefs}>
          <h2 className="section-title">{lang.termination.title}</h2>
          <p className="section-description">{lang.termination.description}</p>
          <div className="warning-list">
            {lang.termination.cases.map((item, index) => (
              <div key={index} className="warning-item">
                <div className="warning-icon">✗</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agreement */}
        <section className="policy-section" ref={addToRefs} style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderLeft: '5px solid #2196f3' }}>
          <h2 className="section-title">{lang.agreement.title}</h2>
          <p className="consent-text">{lang.agreement.text}</p>
        </section>

        {/* Updates */}
        <section className="policy-section" ref={addToRefs}>
          <div className="section-icon">🔄</div>
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

export default TermsConditions;
