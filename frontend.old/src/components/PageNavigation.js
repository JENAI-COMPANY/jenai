import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/PageNavigation.css';

const PageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const navRef = useRef(null);

  useEffect(() => {
    // Animate navigation buttons on mount
    if (navRef.current) {
      const buttons = navRef.current.children;
      gsap.fromTo(
        buttons,
        { opacity: 0, y: -20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  const navButtons = [
    { path: '/', labelEn: 'Home', labelAr: 'الرئيسية', icon: '🏠' },
    { path: '/products-page', labelEn: 'Products', labelAr: 'المنتجات', icon: '🛍️' },
    { path: '/services', labelEn: 'Services', labelAr: 'الخدمات', icon: '⚙️' },
    { path: '/contact', labelEn: 'Contact Us', labelAr: 'اتصل بنا', icon: '📞' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="page-navigation">
      <div className="nav-buttons" ref={navRef}>
        {navButtons.map((button) => (
          <button
            key={button.path}
            className={`nav-btn ${isActive(button.path) ? 'active' : ''}`}
            onClick={() => navigate(button.path)}
          >
            <span className="nav-btn-icon">{button.icon}</span>
            <span className="nav-btn-text">
              {t('language') === 'ar' ? button.labelAr : button.labelEn}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PageNavigation;
