import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Footer.css';

const Footer = () => {
  const { t, language } = useLanguage();
  const { user } = useContext(AuthContext);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // Generate session ID for tracking
  useEffect(() => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }

    // Track user activity every 30 seconds
    const trackActivity = async () => {
      try {
        await axios.post('http://localhost:5000/api/analytics/track', {
          sessionId
        });
      } catch (error) {
        console.error('Error tracking activity:', error);
      }
    };

    // Initial track
    trackActivity();

    // Set interval for heartbeat
    const interval = setInterval(trackActivity, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch active users count if super admin
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      const fetchActiveUsers = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/analytics/active-users/count', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setActiveUsersCount(response.data.count);
        } catch (error) {
          console.error('Error fetching active users:', error);
        }
      };

      fetchActiveUsers();
      // Refresh count every 10 seconds
      const interval = setInterval(fetchActiveUsers, 10000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const contactInfo = {
    companyOwner: '00970598809058',
    financialManager: '00970569464046', // ريم قلالوة
    gazaBranchManager: '00970566999960', // عبد الرحمن شكور
    customerService: '00970599020888',
    email: 'service@jenai-4u.com',
    managementEmail: 'maneger@jenai-4u.com',
    address: language === 'ar'
      ? 'فلسطين'
      : 'Palestine'
  };

  const socialMedia = {
    facebook: 'https://facebook.com/jenai',
    instagram: 'https://instagram.com/jenai',
    twitter: 'https://twitter.com/jenai',
    linkedin: 'https://linkedin.com/company/jenai',
    youtube: 'https://youtube.com/jenai',
    whatsapp: 'https://wa.me/15550100'
  };

  const quickLinks = [
    { name: language === 'ar' ? 'الرئيسية' : 'Home', path: '/' },
    { name: language === 'ar' ? 'المنتجات' : 'Products', path: '/products' },
    { name: language === 'ar' ? 'الخدمات' : 'Services', path: '/services' },
    { name: language === 'ar' ? 'من نحن' : 'About Us', path: '/about' },
    { name: language === 'ar' ? 'اتصل بنا' : 'Contact', path: '/contact' }
  ];

  const informationLinks = [
    { name: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', path: '/terms' },
    { name: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', path: '/privacy' },
    { name: language === 'ar' ? 'سياسة الإرجاع' : 'Return Policy', path: '/returns' },
    { name: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', path: '/faq' },
    { name: language === 'ar' ? 'شهادات الشركة' : 'Certificates', path: '/certificates' }
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Company Info */}
        <div className="footer-section">
          <h3 className="footer-title">
            {language === 'ar' ? 'شركة جيناي' : 'Jenai Company'}
          </h3>
          <p className="footer-description">
            {language === 'ar'
              ? 'منصة التسويق التعاوني والتجارة الإلكترونية الرائدة'
              : 'Leading Cooperative Marketing and E-Commerce Platform'}
          </p>
          {user && user.role === 'super_admin' && (
            <div className="visitor-counter">
              <span className="counter-icon">👥</span>
              <span className="counter-text">
                {language === 'ar' ? 'المستخدمون الآن:' : 'Online Now:'} <strong>{activeUsersCount}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-subtitle">
            {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
          </h4>
          <ul className="footer-links">
            {quickLinks.map((link, index) => (
              <li key={index}>
                <Link to={link.path}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Information */}
        <div className="footer-section">
          <h4 className="footer-subtitle">
            {language === 'ar' ? 'معلومات' : 'Information'}
          </h4>
          <ul className="footer-links">
            {informationLinks.map((link, index) => (
              <li key={index}>
                <Link to={link.path}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Us */}
        <div className="footer-section">
          <h4 className="footer-subtitle">
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </h4>
          <div className="contact-list">
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'صاحب الشركة:' : 'Company Owner:'}
              </span>
              <a href={`tel:${contactInfo.companyOwner}`}>{contactInfo.companyOwner}</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'المدير المالي - ريم قلالوة:' : 'Financial Manager - Reem Qalalwa:'}
              </span>
              <a href={`tel:${contactInfo.financialManager}`}>{contactInfo.financialManager}</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'مدير فرع غزة - عبد الرحمن شكور:' : 'Gaza Branch - Abdul Rahman Shakour:'}
              </span>
              <a href={`tel:${contactInfo.gazaBranchManager}`}>{contactInfo.gazaBranchManager}</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'خدمة العملاء:' : 'Customer Service:'}
              </span>
              <a href={`tel:${contactInfo.customerService}`}>{contactInfo.customerService}</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}
              </span>
              <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">
                {language === 'ar' ? 'بريد الإدارة:' : 'Management Email:'}
              </span>
              <a href={`mailto:${contactInfo.managementEmail}`}>{contactInfo.managementEmail}</a>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="footer-social">
        <h4 className="social-title">
          {language === 'ar' ? 'تابعنا على وسائل التواصل' : 'Follow Us'}
        </h4>
        <div className="social-icons">
          <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-icon facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-icon instagram">
            <i className="fab fa-instagram"></i>
          </a>
          <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-icon twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon linkedin">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="social-icon youtube">
            <i className="fab fa-youtube"></i>
          </a>
          <a href={socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="social-icon whatsapp">
            <i className="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p className="copyright">
          © {new Date().getFullYear()} {language === 'ar' ? 'شركة جيناي. جميع الحقوق محفوظة.' : 'Jenai Company. All rights reserved.'}
        </p>
        <div className="footer-badges">
          <span className="badge-item">🔒 {language === 'ar' ? 'موقع آمن' : 'Secure Site'}</span>
          <span className="badge-item">✓ {language === 'ar' ? 'معتمد' : 'Verified'}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
