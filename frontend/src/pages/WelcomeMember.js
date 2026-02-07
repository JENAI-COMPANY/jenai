import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/WelcomeMember.css';

const WelcomeMember = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sponsorData, setSponsorData] = useState(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // التحقق من وجود flag للترحيب - يعمل مرة واحدة فقط
    const showWelcome = sessionStorage.getItem('showWelcomePage');

    if (!showWelcome || showWelcome !== 'true') {
      // إذا لم يكن هناك flag، نعيد التوجيه للصفحة الرئيسية
      navigate('/', { replace: true });
      return;
    }

    // flag موجود، نعرض الصفحة
    setShouldShow(true);

    // قراءة بيانات الراعي
    const sponsorDataStr = sessionStorage.getItem('welcomeSponsorData');
    if (sponsorDataStr && sponsorDataStr !== 'null') {
      try {
        setSponsorData(JSON.parse(sponsorDataStr));
      } catch (e) {
        console.error('Error parsing sponsor data:', e);
      }
    }
  }, []); // بدون dependencies - يعمل مرة واحدة فقط

  const handleContinue = () => {
    // مسح البيانات والflag
    sessionStorage.removeItem('welcomeSponsorData');
    sessionStorage.removeItem('showWelcomePage');
    localStorage.removeItem('welcomeMemberData');
    localStorage.removeItem('welcomeSponsorData');

    // الذهاب للصفحة الرئيسية
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  // انتظر حتى يتم التحقق من الـ flag والمستخدم
  if (!shouldShow || !user) {
    return (
      <div className="welcome-member-container loading">
        <div className="loading-spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="welcome-member-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="success-icon">✓</div>
          <h1>
            {language === 'ar'
              ? `تهانينا ${user.name || ''} , لقد اتممت عملية التسجيل بنجاح`
              : `Congratulations ${user.name || ''}, Registration Successful!`
            }
          </h1>
          <p className="welcome-subtitle">
            {language === 'ar'
              ? 'اهلا بك في عائلة JENAI'
              : 'Welcome to the JENAI family'
            }
          </p>
        </div>

        <div className="member-info-card">
          <div className="info-row">
            <span className="info-label">
              {language === 'ar' ? 'اسم الراعي:' : 'Sponsor Name:'}
            </span>
            <span className="info-value">
              {sponsorData?.name || (language === 'ar' ? 'لا يوجد' : 'None')}
            </span>
          </div>

          {sponsorData?.subscriberCode && (
            <div className="info-row">
              <span className="info-label">
                {language === 'ar' ? 'رقم عضوية الراعي:' : 'Sponsor ID:'}
              </span>
              <span className="info-value">{sponsorData.subscriberCode}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">
              {language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
            </span>
            <span className="info-value">{user.name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {language === 'ar' ? 'رقم العضوية:' : 'Membership ID:'}
            </span>
            <span className="info-value highlight">{user.subscriberCode}</span>
          </div>

          <div className="info-row">
            <span className="info-label">
              {language === 'ar' ? 'تاريخ التسجيل:' : 'Registration Date:'}
            </span>
            <span className="info-value">{formatDate(user.createdAt)}</span>
          </div>
        </div>

        <div className="ranks-preview">
          <div className="rank-icon">🏆</div>
          <div className="rank-icon gold">⭐</div>
          <div className="rank-icon">🎖️</div>
          <div className="rank-icon">🏆</div>
          <div className="rank-icon gold">⭐</div>
          <div className="rank-icon">🎖️</div>
        </div>

        <div className="bonus-section">
          <div className="bonus-card">
            <div className="bonus-icon">🎁</div>
            <div className="bonus-content">
              <h3>
                {language === 'ar'
                  ? 'هدية الترحيب - 10 نقاط مجانية!'
                  : 'Welcome Gift - 10 Free Points!'
                }
              </h3>
              <p>
                {language === 'ar'
                  ? 'قم بأول عملية شراء خلال شهر من تاريخ تسجيلك واحصل على 10 نقاط هدية إضافية!'
                  : 'Make your first purchase within a month of registration and get 10 bonus points!'
                }
              </p>
              <div className="bonus-timer">
                <span className="timer-icon">⏰</span>
                <span>
                  {language === 'ar'
                    ? 'العرض ساري لمدة 30 يوم من تاريخ التسجيل'
                    : 'Offer valid for 30 days from registration'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-message">
          <p>
            {language === 'ar'
              ? 'الآن بإمكانك طلب منتجاتنا عبر الموقع الإلكتروني الخاص بنا أو من خلال زيارة أحد فروعنا'
              : 'You can now order our products through our website or by visiting one of our branches'
            }
          </p>
        </div>

        <button className="continue-btn" onClick={handleContinue}>
          {language === 'ar' ? 'إكمال' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeMember;
