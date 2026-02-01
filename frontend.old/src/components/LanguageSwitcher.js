import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      className="language-switcher"
      onClick={toggleLanguage}
      aria-label="Toggle Language"
    >
      <span className={`lang-option ${language === 'en' ? 'active' : ''}`}>EN</span>
      <span className="divider">|</span>
      <span className={`lang-option ${language === 'ar' ? 'active' : ''}`}>AR</span>
    </button>
  );
};

export default LanguageSwitcher;
