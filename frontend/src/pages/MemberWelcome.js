import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MemberWelcome.css';

const MemberWelcome = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Redirect if not logged in or not a member
    if (!user) {
      navigate('/login');
      return;
    }

    // Show content with animation
    setTimeout(() => setShowContent(true), 300);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="member-welcome-container">
      <div className={`welcome-card ${showContent ? 'show' : ''}`}>
        {/* Success Icons */}
        <div className="success-icons">
          <div className="icon-trophy">🏆</div>
          <div className="icon-star">⭐</div>
          <div className="icon-celebration">🎉</div>
          <div className="icon-trophy">🏆</div>
          <div className="icon-star">⭐</div>
          <div className="icon-celebration">🎉</div>
        </div>

        {/* Welcome Message */}
        <h1 className="welcome-title">
          {language === 'ar'
            ? 'تهانينا حسين، لقد اتممت عملية التسجيل بنجاح'
            : 'Congratulations Hussein, Your Registration is Complete!'}
        </h1>

        <p className="welcome-subtitle">
          {language === 'ar'
            ? 'أهلاً بك في عائلة جيناي'
            : 'Welcome to the Jenai Family'}
        </p>

        {/* Member Details */}
        <div className="member-details">
          <div className="detail-row">
            <span className="detail-label">
              {language === 'ar' ? 'الاسم الرائع:' : 'Name:'}
            </span>
            <span className="detail-value">{user.name}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              {language === 'ar' ? 'رقم عضويتك الرائع:' : 'Membership Number:'}
            </span>
            <span className="detail-value">{user.subscriberCode || '-'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              {language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
            </span>
            <span className="detail-value">{user.name}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              {language === 'ar' ? 'رقم الجوال:' : 'Mobile Number:'}
            </span>
            <span className="detail-value">{user.phone || '-'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">
              {language === 'ar' ? 'تاريخ التسجيل:' : 'Registration Date:'}
            </span>
            <span className="detail-value">
              {new Date(user.createdAt || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
            </span>
          </div>
        </div>

        {/* Bonus Offer */}
        <div className="bonus-offer">
          <div className="bonus-icon">🎁</div>
          <h3>{language === 'ar' ? 'عرض خاص!' : 'Special Offer!'}</h3>
          <p className="bonus-text">
            {language === 'ar'
              ? 'الآن بإمكانك طلب منتجاتك عبر الموقع الإلكتروني، احصل على 10 نقاط هدية عند أول عملية شراء خلال شهر من تاريخ اليوم!'
              : 'Now you can order products through the website. Get 10 bonus points on your first purchase within one month from today!'}
          </p>
          <div className="bonus-points">10 {language === 'ar' ? 'نقاط' : 'POINTS'} 🌟</div>
        </div>

        {/* Visit Links */}
        <div className="visit-links">
          <p className="visit-text">
            {language === 'ar'
              ? 'تفضل بزيارة أحد فروعنا:'
              : 'Visit one of our branches:'}
          </p>
          <div className="links-container">
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="visit-link google"
            >
              <span className="link-icon">🔗</span>
              {language === 'ar' ? 'زيارة جوجل' : 'Visit Google'}
            </a>
            <a
              href="https://meet.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="visit-link google"
            >
              <span className="link-icon">🔗</span>
              meet.google.com
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-primary"
            onClick={() => navigate('/products')}
          >
            {language === 'ar' ? 'ابدأ التسوق الآن' : 'Start Shopping Now'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/profile')}
          >
            {language === 'ar' ? 'عرض ملفي الشخصي' : 'View My Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberWelcome;
