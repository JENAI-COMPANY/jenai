import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/CallToAction.css';

const CallToAction = ({ variant = 'default' }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);

  // لا تعرض العبارة التحفيزية إذا كان المستخدم مسجل دخول
  if (user) {
    return null;
  }

  const content = {
    ar: {
      title: 'انضم اليوم إلى جيناي الفلسطينية',
      subtitle: 'وكن جزءًا من قصة نجاح وطنية',
      description: 'الفرصة متاحة… القرار قرارك',
      action: 'ابدأ الآن، فالقادم أكبر',
      button: 'سجل الآن',
      stats: [
        { number: '10,000+', label: 'عضو نشط' },
        { number: '500+', label: 'منتج عالي الجودة' },
        { number: '50+', label: 'دولة حول العالم' }
      ]
    },
    en: {
      title: 'Join Jenai Palestine Today',
      subtitle: 'And be part of a national success story',
      description: 'The opportunity is available... The decision is yours',
      action: 'Start now, the best is yet to come',
      button: 'Register Now',
      stats: [
        { number: '10,000+', label: 'Active Members' },
        { number: '500+', label: 'High-Quality Products' },
        { number: '50+', label: 'Countries Worldwide' }
      ]
    }
  };

  const lang = content[language];

  const handleClick = () => {
    navigate('/register');
  };

  return (
    <div className={`cta-component cta-${variant}`}>
      <div className="cta-background">
        <div className="cta-pattern"></div>
      </div>

      <div className="cta-content">
        <div className="cta-icon">🇵🇸</div>
        <h2 className="cta-title">{lang.title}</h2>
        <p className="cta-subtitle">{lang.subtitle}</p>
        <p className="cta-description">{lang.description}</p>
        <p className="cta-action">{lang.action}</p>

        {variant === 'detailed' && (
          <div className="cta-stats">
            {lang.stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <button className="cta-button" onClick={handleClick}>
          <span>{lang.button}</span>
          <span className="button-arrow">→</span>
        </button>
      </div>

      <div className="cta-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default CallToAction;
