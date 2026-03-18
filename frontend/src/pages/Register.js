import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import TermsAndConditions from '../components/TermsAndConditions';
import gsap from 'gsap';
import '../styles/Auth.css';
import { countryCodes } from '../utils/countryCodes';

const Register = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const refType = searchParams.get('type'); // 'customer' or 'member'

  // If both ref and type are in URL, skip account type selection and lock the role
  const hasDirectLink = refCode && refType && (refType === 'customer' || refType === 'member');

  const [step, setStep] = useState(hasDirectLink ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState(hasDirectLink ? refType : (refCode ? 'member' : ''));
  const [isRefCodeLocked, setIsRefCodeLocked] = useState(false);
  const [isRoleLocked, setIsRoleLocked] = useState(hasDirectLink);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    firstName: '',
    fatherName: '',
    familyName: '',
    phone: '',
    countryCode: '+970',
    country: '',
    city: '',
    password: '',
    confirmPassword: '',
    sponsorId: refCode || '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [checkingReferrer, setCheckingReferrer] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Lock referral code and role if they came from URL
  useEffect(() => {
    if (refCode) {
      setFormData(prev => ({ ...prev, sponsorId: refCode }));
      setIsRefCodeLocked(true);

      // If type is specified in URL, use it; otherwise default to 'member' for backward compatibility
      if (refType && (refType === 'customer' || refType === 'member')) {
        setSelectedRole(refType);
        setIsRoleLocked(true);
      } else {
        setSelectedRole('member');
      }

      checkReferralCode(refCode);
    }
  }, [refCode, refType]);
  const boxRef = useRef(null);
  const optionsRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (step === 1) {
      // Animate account type selection - opacity only (no transforms to avoid iOS Safari layout bugs)
      gsap.fromTo(
        boxRef.current,
        { opacity: 0 },
        {
          opacity: 1, duration: 0.5, ease: 'power3.out',
          onComplete: () => gsap.set(boxRef.current, { clearProps: 'all' })
        }
      );

      if (optionsRef.current) {
        gsap.fromTo(
          optionsRef.current.children,
          { opacity: 0 },
          {
            opacity: 1, duration: 0.5, stagger: 0.15, delay: 0.2, ease: 'power3.out',
            onComplete: () => {
              if (optionsRef.current) {
                gsap.set(optionsRef.current.children, { clearProps: 'all' });
              }
            }
          }
        );
      }
    } else if (step === 2) {
      // Animate form - opacity only
      gsap.fromTo(
        boxRef.current,
        { opacity: 0 },
        {
          opacity: 1, duration: 0.5, ease: 'power3.out',
          onComplete: () => gsap.set(boxRef.current, { clearProps: 'all' })
        }
      );

      if (formRef.current) {
        gsap.fromTo(
          formRef.current.children,
          { opacity: 0 },
          {
            opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.2, ease: 'power2.out',
            onComplete: () => gsap.set(formRef.current.children, { clearProps: 'all' })
          }
        );
      }
    } else if (step === 3) {
      // Animate terms page - opacity only
      gsap.fromTo(
        boxRef.current,
        { opacity: 0 },
        {
          opacity: 1, duration: 0.5, ease: 'power3.out',
          onComplete: () => gsap.set(boxRef.current, { clearProps: 'all' })
        }
      );
    }
  }, [step]);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  // التحقق من كود الإحالة وجلب اسم الراعي
  const checkReferralCode = async (code) => {
    if (!code || code.trim() === '') {
      setReferrerName('');
      return;
    }

    setCheckingReferrer(true);
    try {
      const response = await fetch(`/api/auth/check-referral/${code}`);
      const data = await response.json();

      if (data.success && data.referrer) {
        setReferrerName(data.referrer.name);
      } else {
        setReferrerName('');
      }
    } catch (error) {
      console.error('Error checking referral code:', error);
      setReferrerName('');
    } finally {
      setCheckingReferrer(false);
    }
  };

  const handleNextStep = () => {
    if (selectedRole) {
      setStep(2);
    } else {
      setError('Please select an account type');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate username to only allow English letters, numbers, underscore, and hyphen
    if (name === 'username') {
      const englishOnly = value.replace(/[^a-zA-Z0-9_-]/g, '');
      setFormData({ ...formData, [name]: englishOnly });
    } else if (name === 'city') {
      const englishOnly = value.replace(/[^a-zA-Z\s-]/g, '');
      setFormData({ ...formData, [name]: englishOnly });
    } else {
      setFormData({ ...formData, [name]: value });

      // التحقق من كود الإحالة عند تغييره
      if (name === 'sponsorId') {
        checkReferralCode(value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    // التحقق من طول كلمة المرور
    if (formData.password.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    // التحقق من جميع الحقول المطلوبة
    if (!formData.username || !formData.firstName || !formData.familyName || !formData.phone) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    // للأعضاء: التحقق من الدولة والمدينة لإنشاء كود الإحالة
    if (selectedRole === 'member' && (!formData.country || !formData.city)) {
      setError(language === 'ar' ? 'الدولة والمدينة مطلوبة للأعضاء لإنشاء كود الإحالة' : 'Country and city are required for members to create referral code');
      return;
    }

    // للأعضاء: التحقق من كود الإحالة مطلوب
    if (selectedRole === 'member' && !formData.sponsorId) {
      setError(language === 'ar' ? 'كود الإحالة مطلوب للأعضاء' : 'Referral code is required for members');
      return;
    }

    // للأعضاء: الانتقال إلى صفحة الشروط والأحكام بعد التحقق من البيانات
    if (selectedRole === 'member') {
      setStep(3);
      return;
    }

    // للعملاء: التسجيل مباشرة
    const { confirmPassword, acceptedTerms, firstName, fatherName, familyName, ...userData } = formData;
    userData.name = [firstName, fatherName, familyName].filter(Boolean).join(' ');
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

    const { confirmPassword, acceptedTerms, firstName, fatherName, familyName, ...userData } = formData;
    userData.name = [firstName, fatherName, familyName].filter(Boolean).join(' ');
    userData.role = selectedRole;

    const result = await register(userData);

    if (result.success) {
      // التحويل حسب نوع الحساب
      if (selectedRole === 'member') {
        // للأعضاء: حفظ بيانات الراعي وflag لعرض صفحة الترحيب
        sessionStorage.setItem('welcomeSponsorData', JSON.stringify(result.sponsor || null));
        sessionStorage.setItem('showWelcomePage', 'true');

        console.log('Register: Navigating to welcome-member');

        // استخدام navigate العادي
        navigate('/welcome-member');
      } else if (selectedRole === 'supplier') {
        // الموردين يذهبون للوحة التحكم
        navigate('/supplier-dashboard');
      } else {
        // العملاء يذهبون للرئيسية
        navigate('/');
      }
    } else {
      setError(result.message);
      setStep(2); // العودة للفورم في حالة الخطأ
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (!isRoleLocked) {
      // Only allow going back to step 1 if role is not locked from referral link
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
        {!isRoleLocked && (
          <button onClick={handleBack} className="back-btn">
            ← {t('backButton')}
          </button>
        )}
        <h2>{t('registerTitle')}</h2>
        <p className="step-subtitle">
          {selectedRole === 'customer'
            ? t('regularCustomer')
            : t('networkMember')}
        </p>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} ref={formRef} autoComplete="off">
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
            <label>{language === 'ar' ? 'الاسم الأول' : 'First Name'} *</label>
            <input
              type="text"
              name="firstName"
              placeholder={language === 'ar' ? 'الاسم الأول' : 'First Name'}
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'اسم الأب' : 'Father\'s Name'}</label>
            <input
              type="text"
              name="fatherName"
              placeholder={language === 'ar' ? 'اسم الأب' : 'Father\'s Name'}
              value={formData.fatherName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>{language === 'ar' ? 'اسم العائلة' : 'Family Name'} *</label>
            <input
              type="text"
              name="familyName"
              placeholder={language === 'ar' ? 'اسم العائلة' : 'Family Name'}
              value={formData.familyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('phoneNumber')} *</label>
            <div className="phone-input-row">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
              >
                {countryCodes.map((item) => (
                  <option key={item.code + item.country} value={item.code}>
                    {item.code} - {item.countryAr}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="phone"
                placeholder={language === 'ar' ? '5xxxxxxxx' : '5xxxxxxxx'}
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              {language === 'ar' ? 'الدولة' : 'Country'}
              {selectedRole === 'member' ? ' *' : (language === 'ar' ? ' (اختياري)' : ' (Optional)')}
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required={selectedRole === 'member'}
            >
              <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
              <option value="Egypt">🇪🇬 Egypt - مصر</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia - السعودية</option>
              <option value="UAE">🇦🇪 UAE - الإمارات</option>
              <option value="Kuwait">🇰🇼 Kuwait - الكويت</option>
              <option value="Qatar">🇶🇦 Qatar - قطر</option>
              <option value="Bahrain">🇧🇭 Bahrain - البحرين</option>
              <option value="Oman">🇴🇲 Oman - عُمان</option>
              <option value="Jordan">🇯🇴 Jordan - الأردن</option>
              <option value="Lebanon">🇱🇧 Lebanon - لبنان</option>
              <option value="Palestine">🇵🇸 Palestine - فلسطين</option>
              <option value="Syria">🇸🇾 Syria - سوريا</option>
              <option value="Iraq">🇮🇶 Iraq - العراق</option>
              <option value="Yemen">🇾🇪 Yemen - اليمن</option>
              <option value="Libya">🇱🇾 Libya - ليبيا</option>
              <option value="Tunisia">🇹🇳 Tunisia - تونس</option>
              <option value="Algeria">🇩🇿 Algeria - الجزائر</option>
              <option value="Morocco">🇲🇦 Morocco - المغرب</option>
              <option value="Sudan">🇸🇩 Sudan - السودان</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              {language === 'ar' ? 'المدينة' : 'City'}
              {selectedRole === 'member' ? ' *' : (language === 'ar' ? ' (اختياري)' : ' (Optional)')}
            </label>
            <input
              type="text"
              name="city"
              placeholder="Jenin / Ramallah / Gaza"
              value={formData.city}
              onChange={handleChange}
              required={selectedRole === 'member'}
            />
          </div>

          <div className="form-group password-group">
            <label>{t('password')} *</label>
            <input
              type={showRegPass ? 'text' : 'password'}
              name="password"
              placeholder={t('password')}
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
              className="password-input"
            />
            <button type="button" className="password-toggle-btn" onClick={() => setShowRegPass(v => !v)}>
              {showRegPass ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="form-group password-group">
            <label>{t('confirmPassword')} *</label>
            <input
              type={showRegConfirmPass ? 'text' : 'password'}
              name="confirmPassword"
              placeholder={t('confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="password-input"
            />
            <button type="button" className="password-toggle-btn" onClick={() => setShowRegConfirmPass(v => !v)}>
              {showRegConfirmPass ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="form-group sponsor-section">
            <label>
              {t('referralCode')}
              {selectedRole === 'member'
                ? ' *'
                : (language === 'ar' ? ' (اختياري)' : ' (Optional)')}
              {isRefCodeLocked && (
                <span className="locked-badge">🔒</span>
              )}
            </label>
            <input
              type="text"
              name="sponsorId"
              value={formData.sponsorId}
              onChange={handleChange}
              placeholder={t('referralCode')}
              required={selectedRole === 'member'}
              readOnly={isRefCodeLocked}
              className={isRefCodeLocked ? 'locked-input' : ''}
            />
            {checkingReferrer && (
              <small className="help-text" style={{ color: '#667eea' }}>
                {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
              </small>
            )}
            {!checkingReferrer && referrerName && (
              <small className="help-text" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                ✓ {language === 'ar' ? 'اسم الراعي: ' : 'Sponsor Name: '}{referrerName}
              </small>
            )}
            {!checkingReferrer && formData.sponsorId && !referrerName && (
              <small className="help-text" style={{ color: '#f44336' }}>
                {language === 'ar' ? 'كود الإحالة غير صحيح' : 'Invalid referral code'}
              </small>
            )}
            <small className="help-text">
              {isRefCodeLocked
                ? (language === 'ar'
                  ? 'تم تعبئة كود الإحالة تلقائياً من الرابط'
                  : 'Referral code auto-filled from link')
                : selectedRole === 'member'
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
