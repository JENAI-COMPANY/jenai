import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CallToAction from '../components/CallToAction';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/FAQ.css';

gsap.registerPlugin(ScrollTrigger);

const FAQ = () => {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(null);
  const faqRef = useRef(null);

  useEffect(() => {
    if (faqRef.current) {
      gsap.fromTo(
        faqRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out'
        }
      );
    }
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const content = {
    ar: {
      title: 'الأسئلة الشائعة',
      subtitle: 'إجابات على أكثر الأسئلة شيوعاً حول جيناي',
      faqs: [
        {
          question: 'هل التسجيل في جيناي مجاني؟',
          answer: 'نعم، التسجيل في جيناي مجاني بالكامل. لا توجد أي رسوم للانضمام إلى المنصة والبدء في استخدام خدماتنا.'
        },
        {
          question: 'هل أحتاج خبرة سابقة أو شهادات؟',
          answer: 'لا، لا تحتاج إلى خبرة سابقة أو شهادات. نحن في جيناي نوفر لك التدريب والدعم خطوة بخطوة من خلال أكاديمية التدريب الخاصة بنا.'
        },
        {
          question: 'كيف أربح من جيناي؟',
          answer: 'يمكنك الربح من خلال عدة طرق:\n• الاستهلاك الشخصي: شراء المنتجات والخدمات من شركتنا\n• جمع النقاط: تحويل النقاط إلى أرباح\n• بناء فريق: من خلال نظام التسويق التعاوني\n• التسويق: بيع المنتجات والخدمات لغير الأعضاء'
        },
        {
          question: 'متى أستلم أرباحي؟',
          answer: 'يتم احتساب الأرباح بنهاية كل دورة ربحية (نهاية كل شهر) حسب نظام الشركة. يتم صرف الأرباح وفقاً للحد الأدنى المحدد وطريقة الدفع المختارة.'
        },
        {
          question: 'هل يمكنني العمل بدوام جزئي؟',
          answer: 'نعم، بالتأكيد! جيناي تناسب جميع الأوقات. يمكنك العمل بدوام كامل أو جزئي حسب وقتك المتاح وأهدافك الشخصية.'
        },
        {
          question: 'هل أستطيع الانسحاب؟',
          answer: 'نعم، يمكنك الانسحاب في أي وقت وفق الشروط والأحكام المعتمدة. يمكنك التواصل مع فريق الدعم لإتمام الإجراءات.'
        },
        {
          question: 'ما هي المنتجات المتوفرة؟',
          answer: 'نوفر مجموعة واسعة من المنتجات عالية الجودة في مختلف الفئات. يمكنك تصفح قسم المنتجات للاطلاع على كافة العروض المتاحة.'
        },
        {
          question: 'كيف يتم حساب العمولات؟',
          answer: 'تُحسب العمولات وفقاً لنظام التسويق التعاوني المعتمد في الشركة. كلما زاد نشاطك وبنيت فريقك، زادت أرباحك المحتملة.'
        },
        {
          question: 'هل يوجد دعم فني؟',
          answer: 'نعم، نوفر دعماً فنياً متواصلاً عبر قنوات متعددة: الهاتف، البريد الإلكتروني، والواتساب. فريقنا جاهز لمساعدتك.'
        },
        {
          question: 'هل يمكنني استرجاع المنتجات؟',
          answer: 'نعم، لدينا سياسة استرجاع واضحة. يمكنك استرجاع المنتجات خلال 3 أيام من تاريخ الاستلام بشرط أن تكون بحالتها الأصلية.'
        },
        {
          question: 'كيف أبني فريقي؟',
          answer: 'من خلال دعوة أصدقائك وعائلتك للانضمام إلى جيناي باستخدام رمز الإحالة الخاص بك. نوفر لك الأدوات والتدريب اللازم لبناء فريق ناجح.'
        },
        {
          question: 'هل البيانات آمنة؟',
          answer: 'نعم، نحن نلتزم بأعلى معايير الأمان والخصوصية. جميع بياناتك محمية بتشفير SSL ولا نشاركها مع أطراف ثالثة.'
        }
      ],
      contact: {
        title: 'لم تجد إجابتك؟',
        description: 'تواصل معنا وسنكون سعداء بمساعدتك',
        button: 'اتصل بنا'
      }
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Answers to the most common questions about Jenai',
      faqs: [
        {
          question: 'Is registration in Jenai free?',
          answer: 'Yes, registration in Jenai is completely free. There are no fees to join the platform and start using our services.'
        },
        {
          question: 'Do I need previous experience or certificates?',
          answer: 'No, you don\'t need previous experience or certificates. At Jenai, we provide step-by-step training and support through our dedicated training academy.'
        },
        {
          question: 'How do I earn from Jenai?',
          answer: 'You can earn through several ways:\n• Personal consumption: Purchasing products and services from our company\n• Collecting points: Converting points to profits\n• Building a team: Through the cooperative marketing system\n• Marketing: Selling products and services to non-members'
        },
        {
          question: 'When do I receive my profits?',
          answer: 'Profits are calculated at the end of each profit cycle (end of each month) according to the company system. Profits are disbursed according to the specified minimum and chosen payment method.'
        },
        {
          question: 'Can I work part-time?',
          answer: 'Yes, absolutely! Jenai suits all schedules. You can work full-time or part-time according to your available time and personal goals.'
        },
        {
          question: 'Can I withdraw?',
          answer: 'Yes, you can withdraw at any time according to the approved terms and conditions. You can contact the support team to complete the procedures.'
        },
        {
          question: 'What products are available?',
          answer: 'We offer a wide range of high-quality products in various categories. You can browse the products section to view all available offers.'
        },
        {
          question: 'How are commissions calculated?',
          answer: 'Commissions are calculated according to the approved cooperative marketing system in the company. The more active you are and the more you build your team, the higher your potential earnings.'
        },
        {
          question: 'Is there technical support?',
          answer: 'Yes, we provide continuous technical support through multiple channels: phone, email, and WhatsApp. Our team is ready to help you.'
        },
        {
          question: 'Can I return products?',
          answer: 'Yes, we have a clear return policy. You can return products within 3 days from the date of receipt, provided they are in their original condition.'
        },
        {
          question: 'How do I build my team?',
          answer: 'By inviting your friends and family to join Jenai using your referral code. We provide you with the tools and training needed to build a successful team.'
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes, we are committed to the highest standards of security and privacy. All your data is protected with SSL encryption and we do not share it with third parties.'
        }
      ],
      contact: {
        title: 'Didn\'t find your answer?',
        description: 'Contact us and we\'ll be happy to help you',
        button: 'Contact Us'
      }
    }
  };

  const lang = content[language];

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <div className="faq-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-icon">❓</div>
          <h1 className="hero-title">{lang.title}</h1>
          <p className="hero-subtitle">{lang.subtitle}</p>
        </div>
      </div>

      <div className="faq-container">
        <div className="faq-list" ref={faqRef}>
          {lang.faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span className="question-number">{index + 1}</span>
                <span className="question-text">{faq.question}</span>
                <span className="question-icon">
                  {activeIndex === index ? '−' : '+'}
                </span>
              </button>
              <div className={`faq-answer ${activeIndex === index ? 'show' : ''}`}>
                <div className="answer-content">
                  {faq.answer.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <CallToAction variant="detailed" />

        {/* Contact Section */}
        <div className="faq-contact">
          <div className="contact-icon">💬</div>
          <h2>{lang.contact.title}</h2>
          <p>{lang.contact.description}</p>
          <button
            className="contact-button"
            onClick={() => window.location.href = '/contact'}
          >
            {lang.contact.button}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
