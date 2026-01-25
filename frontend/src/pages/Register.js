import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import TermsAndConditions from '../components/TermsAndConditions';
import gsap from 'gsap';
import '../styles/Auth.css';

const Register = () => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone: '',
    country: '',
    city: '',
    password: '',
    confirmPassword: '',
    sponsorId: '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const optionsRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (step === 1) {
      // Animate account type selection
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );

      if (optionsRef.current) {
        gsap.fromTo(
          optionsRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, delay: 0.2, ease: 'power3.out' }
        );
      }
    } else if (step === 2) {
      // Animate form
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }
      );

      if (formRef.current) {
        gsap.fromTo(
          formRef.current.children,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, delay: 0.2, ease: 'power2.out' }
        );
      }
    } else if (step === 3) {
      // Animate terms page
      gsap.fromTo(
        boxRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [step]);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleNextStep = () => {
    if (selectedRole) {
      setStep(2);
    } else {
      setError('Please select an account type');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    // للأعضاء: الانتقال إلى صفحة الشروط والأحكام
    if (selectedRole === 'member') {
      setStep(3);
      return;
    }

    // للعملاء: التسجيل مباشرة
    const { confirmPassword, acceptedTerms, ...userData } = formData;
    userData.role = selectedRole;

    const result = await register(userData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleFinalSubmit = async () => {
    setError('');

    // التحقق من قبول الشروط والأحكام
    if (!formData.acceptedTerms) {
      setError(language === 'ar' ? 'يجب الموافقة على الشروط والأحكام للمتابعة' : 'You must accept the terms and conditions to continue');
      return;
    }

    const { confirmPassword, acceptedTerms, ...userData } = formData;
    userData.role = selectedRole;

    const result = await register(userData);

    if (result.success) {
      navigate('/subscriber-instructions');
    } else {
      setError(result.message);
      setStep(2); // العودة للفورم في حالة الخطأ
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else {
      setStep(1);
    }
    setError('');
  };

  // Step 1: Choose Account Type
  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-box" ref={boxRef}>
          <h2>{t('chooseAccountType')}</h2>
          <p className="step-subtitle">{language === 'ar' ? 'اختر كيف تريد استخدام منصتنا' : 'Select how you want to use our platform'}</p>
          {error && <div className="error-message">{error}</div>}

          <div className="account-type-section">
            <div className="account-type-options" ref={optionsRef}>
              <div
                className={`account-option ${selectedRole === 'customer' ? 'selected' : ''}`}
                onClick={() => handleRoleSelection('customer')}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="customer"
                  checked={selectedRole === 'customer'}
                  onChange={() => handleRoleSelection('customer')}
                />
                <div className="option-content">
                  <h4>{t('regularCustomer')}</h4>
                  <p>{t('regularCustomerDesc')}</p>
                </div>
              </div>

              <div
                className={`account-option ${selectedRole === 'member' ? 'selected' : ''}`}
                onClick={() => handleRoleSelection('member')}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="member"
                  checked={selectedRole === 'member'}
                  onChange={() => handleRoleSelection('member')}
                />
                <div className="option-content">
                  <h4>{t('networkMember')}</h4>
                  <p>{t('networkMemberDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleNextStep} className="submit-btn">
            {t('continueButton')}
          </button>

          <p className="auth-link">
            {t('haveAccount')} <Link to="/login">{t('loginHere')}</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  if (step === 2) {
    return (
      <div className="auth-container">
        <div className="auth-box" ref={boxRef}>
        <button onClick={handleBack} className="back-btn">
          ← {t('backButton')}
        </button>
        <h2>{t('registerTitle')}</h2>
        <p className="step-subtitle">
          {selectedRole === 'customer'
            ? t('regularCustomer')
            : t('networkMember')}
        </p>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="form-group">
            <label>{t('username')} *</label>
            <input
              type="text"
              name="username"
              placeholder={t('username')}
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('fullName')} *</label>
            <input
              type="text"
              name="name"
              placeholder={t('fullName')}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('phoneNumber')} *</label>
            <input
              type="tel"
              name="phone"
              placeholder={t('phoneNumber')}
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'الدولة' : 'Country'} *</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            >
              <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
              <option value="Egypt">Egypt - مصر</option>
              <option value="Saudi Arabia">Saudi Arabia - السعودية</option>
              <option value="UAE">UAE - الإمارات</option>
              <option value="Kuwait">Kuwait - الكويت</option>
              <option value="Qatar">Qatar - قطر</option>
              <option value="Bahrain">Bahrain - البحرين</option>
              <option value="Oman">Oman - عُمان</option>
              <option value="Jordan">Jordan - الأردن</option>
              <option value="Lebanon">Lebanon - لبنان</option>
              <option value="Palestine">Palestine - فلسطين</option>
              <option value="Syria">Syria - سوريا</option>
              <option value="Iraq">Iraq - العراق</option>
              <option value="Yemen">Yemen - اليمن</option>
              <option value="Libya">Libya - ليبيا</option>
              <option value="Tunisia">Tunisia - تونس</option>
              <option value="Algeria">Algeria - الجزائر</option>
              <option value="Morocco">Morocco - المغرب</option>
              <option value="Sudan">Sudan - السودان</option>
            </select>
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'المدينة' : 'City'} *</label>
            <input
              type="text"
              name="city"
              placeholder={language === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name'}
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('password')} *</label>
            <input
              type="password"
              name="password"
              placeholder={t('password')}
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('confirmPassword')} *</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder={t('confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group sponsor-section">
            <label>
              {t('referralCode')}
              {selectedRole === 'member'
                ? ' *'
                : (language === 'ar' ? ' (اختياري)' : ' (Optional)')}
            </label>
            <input
              type="text"
              name="sponsorId"
              value={formData.sponsorId}
              onChange={handleChange}
              placeholder={t('referralCode')}
              required={selectedRole === 'member'}
            />
            <small className="help-text">
              {selectedRole === 'member'
                ? (language === 'ar'
                  ? 'مطلوب: أدخل كود الإحالة من الراعي الخاص بك'
                  : 'Required: Enter the referral code from your sponsor')
                : (language === 'ar'
                  ? 'اختياري: أدخل كود الإحالة من الراعي الخاص بك'
                  : 'Optional: Enter the referral code from your sponsor')}
            </small>
          </div>

          <button type="submit" className="submit-btn">
            {selectedRole === 'member'
              ? (language === 'ar' ? 'متابعة' : 'Continue')
              : t('registerButton')}
          </button>
        </form>

        <p className="auth-link">
          {t('haveAccount')} <Link to="/login">{t('loginHere')}</Link>
        </p>
      </div>
    </div>
    );
  }

  // Step 3: Terms and Conditions (للأعضاء فقط)
  if (step === 3) {
    return (
      <div className="auth-container terms-full-page">
        <div className="auth-box terms-box" ref={boxRef}>
          <button onClick={handleBack} className="back-btn">
            ← {language === 'ar' ? 'رجوع' : 'Back'}
          </button>

          <div className="terms-full-container">
            <TermsAndConditions />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="terms-acceptance-footer">
            <label className="terms-checkbox-label-large">
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                className="terms-checkbox-large"
              />
              <span className="terms-checkbox-text-large">
                {language === 'ar'
                  ? 'أوافق على الشروط والأحكام وأقر بأنني قرأتها وفهمتها بالكامل *'
                  : 'I agree to the terms and conditions and acknowledge that I have read and understood them *'}
              </span>
            </label>

            <button
              onClick={handleFinalSubmit}
              className="submit-btn"
              disabled={!formData.acceptedTerms}
            >
              {language === 'ar' ? 'إتمام التسجيل' : 'Complete Registration'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default Register;
