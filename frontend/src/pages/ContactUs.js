import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/ContactUs.css';

const ContactUs = () => {
  const { language } = useLanguage();
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const infoRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Animate header
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );

    // Animate form and info cards
    gsap.fromTo(
      [formRef.current, infoRef.current],
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.2, ease: 'back.out(1.2)', delay: 0.3 }
    );
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // إرسال البريد الإلكتروني إلى service@jenai-4u.com
    const mailtoLink = `mailto:service@jenai-4u.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `الاسم: ${formData.name}\n` +
      `البريد الإلكتروني: ${formData.email}\n` +
      `رقم الهاتف: ${formData.phone}\n\n` +
      `الرسالة:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="contact-page">
      <div className="contact-header" ref={headerRef}>
        <h1>{language === 'ar' ? 'اتصل بنا' : 'Contact Us'}</h1>
        <p>{language === 'ar' ? 'نحن هنا للمساعدة والإجابة على أي سؤال قد يكون لديك' : 'We are here to help and answer any questions you might have'}</p>
      </div>

      <div className="contact-content">
        <div className="contact-info" ref={infoRef}>
          <h2>{language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h2>

          <div className="info-item">
            <div className="info-icon">📧</div>
            <div>
              <h3>{language === 'ar' ? 'خدمة العملاء' : 'Customer Service'}</h3>
              <p>service@jenai-4u.com</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">📧</div>
            <div>
              <h3>{language === 'ar' ? 'الإدارة' : 'Management'}</h3>
              <p>maneger@jenai-4u.com</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">👤</div>
            <div>
              <h3>{language === 'ar' ? 'صاحب الشركة' : 'Company Owner'}</h3>
              <p>00970598809058</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">💼</div>
            <div>
              <h3>{language === 'ar' ? 'المدير المالي - ريم قلالوة' : 'Financial Manager - Reem Qalalwa'}</h3>
              <p>00970569464046</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">📞</div>
            <div>
              <h3>{language === 'ar' ? 'خدمة العملاء' : 'Customer Service'}</h3>
              <p>00970599020888</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">🏢</div>
            <div>
              <h3>{language === 'ar' ? 'مدير فرع غزة - عبد الرحمن شكور' : 'Gaza Branch Manager - Abdul Rahman Shakour'}</h3>
              <p>00970566999960</p>
            </div>
          </div>
        </div>

        <form className="contact-form" ref={formRef} onSubmit={handleSubmit}>
          <h2>{language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}</h2>

          {submitted && (
            <div className="success-message">
              {language === 'ar' ? '✓ تم إرسال رسالتك بنجاح!' : '✓ Your message has been sent successfully!'}
            </div>
          )}

          <div className="form-group">
            <label>{language === 'ar' ? 'الاسم' : 'Name'}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'الموضوع' : 'Subject'}</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder={language === 'ar' ? 'موضوع رسالتك' : 'Subject of your message'}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'الرسالة' : 'Message'}</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
            ></textarea>
          </div>

          <button type="submit" className="submit-button">
            {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
