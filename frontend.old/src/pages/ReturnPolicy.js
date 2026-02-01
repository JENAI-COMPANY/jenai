import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/Policy.css';

gsap.registerPlugin(ScrollTrigger);

const ReturnPolicy = () => {
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
      title: 'سياسة الاسترجاع',
      intro: 'في شركة جيناي الفلسطينية، نحرص على رضا عملائنا وأعضائنا، ونلتزم بتقديم منتجات عالية الجودة.',
      conditions: {
        title: 'شروط الاسترجاع',
        items: [
          'يحق للزبون أو العضو طلب استرجاع المنتج خلال 3 أيام من تاريخ الاستلام.',
          'يشترط أن يكون المنتج غير مستخدم',
          'يشترط أن يكون المنتج بحالته الأصلية',
          'يشترط أن يكون المنتج بغلافه الكامل',
          'يشترط أن يكون المنتج غير مطابق للمواصفات الموضحة بالسيستم'
        ]
      },
      notReturnable: {
        title: 'لا يمكن استرجاع',
        items: [
          'المنتجات المخصصة حسب الطلب',
          'المنتجات المخفّضة ضمن عروض خاصة'
        ]
      },
      process: {
        title: 'آلية الاسترجاع',
        steps: [
          {
            number: '1',
            title: 'التواصل',
            description: 'يتم التواصل مع خدمة العملاء عبر الهاتف أو البريد الإلكتروني'
          },
          {
            number: '2',
            title: 'الفحص والموافقة',
            description: 'بعد فحص الطلب والموافقة عليه من قبل الفريق المختص'
          },
          {
            number: '3',
            title: 'الحل',
            description: 'يتم استبدال المنتج أو إعادة المبلغ حسب سياسة الشركة'
          }
        ]
      },
      contact: {
        title: 'للاستفسارات',
        description: 'للمزيد من المعلومات أو الاستفسارات حول سياسة الاسترجاع، يرجى التواصل مع خدمة العملاء.'
      }
    },
    en: {
      title: 'Return Policy',
      intro: 'At Jenai Palestine, we care about the satisfaction of our customers and members, and we are committed to providing high-quality products.',
      conditions: {
        title: 'Return Conditions',
        items: [
          'Customers or members have the right to request a product return within 3 days from the date of receipt.',
          'The product must be unused',
          'The product must be in its original condition',
          'The product must have its complete packaging',
          'The product must not match the specifications shown in the system'
        ]
      },
      notReturnable: {
        title: 'Non-Returnable Items',
        items: [
          'Customized products made to order',
          'Discounted products within special offers'
        ]
      },
      process: {
        title: 'Return Process',
        steps: [
          {
            number: '1',
            title: 'Contact',
            description: 'Contact customer service via phone or email'
          },
          {
            number: '2',
            title: 'Review and Approval',
            description: 'After reviewing the request and approval by the specialized team'
          },
          {
            number: '3',
            title: 'Resolution',
            description: 'The product will be replaced or the amount will be refunded according to company policy'
          }
        ]
      },
      contact: {
        title: 'For Inquiries',
        description: 'For more information or inquiries about the return policy, please contact customer service.'
      }
    }
  };

  const lang = content[language];

  return (
    <div className="policy-page">
      {/* Hero Section */}
      <div className="policy-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{lang.title}</h1>
        </div>
      </div>

      <div className="policy-container">
        {/* Introduction */}
        <section className="policy-section" ref={addToRefs}>
          <div className="section-icon">📦</div>
          <p className="intro-text">{lang.intro}</p>
        </section>

        {/* Return Conditions */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.conditions.title}</h2>
          <div className="conditions-list">
            {lang.conditions.items.map((item, index) => (
              <div key={index} className="condition-item">
                <div className="condition-icon">✓</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Non-Returnable Items */}
        <section className="policy-section warning-section" ref={addToRefs}>
          <h2 className="section-title">{lang.notReturnable.title}</h2>
          <div className="warning-list">
            {lang.notReturnable.items.map((item, index) => (
              <div key={index} className="warning-item">
                <div className="warning-icon">✗</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Return Process */}
        <section className="policy-section" ref={addToRefs}>
          <h2 className="section-title">{lang.process.title}</h2>
          <div className="process-steps">
            {lang.process.steps.map((step, index) => (
              <div key={index} className="process-step">
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
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

export default ReturnPolicy;
