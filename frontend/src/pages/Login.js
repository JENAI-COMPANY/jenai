import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/Auth.css';

const Login = () => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const formRef = useRef(null);
  const passwordInputRef = useRef(null);
  const toggleBtnRef = useRef(null);

  useEffect(() => {
    // Animate the auth box on mount
    gsap.fromTo(
      boxRef.current,
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    );

    // Animate form fields, then clear transforms to fix absolute positioning on mobile
    gsap.fromTo(
      formRef.current.children,
      { opacity: 0, x: -30 },
      {
        opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: 'power2.out',
        onComplete: () => {
          gsap.set(formRef.current.children, { clearProps: 'transform,x,y' });
          positionToggleBtn();
        }
      }
    );

    const positionToggleBtn = () => {
      const input = passwordInputRef.current;
      const btn = toggleBtnRef.current;
      if (!input || !btn) return;
      const parent = input.parentElement;
      const parentWidth = parent.offsetWidth;
      const btnW = 28;
      const btnH = 28;
      btn.style.position = 'absolute';
      btn.style.top = (input.offsetTop + input.offsetHeight / 2 - btnH / 2) + 'px';
      btn.style.left = (parentWidth - btnW - 10) + 'px';
      btn.style.right = 'auto';
      btn.style.transform = 'none';
    };

    window.addEventListener('resize', positionToggleBtn);
    return () => window.removeEventListener('resize', positionToggleBtn);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);
    if (result.success) {
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" ref={boxRef}>
        <h2>{t('loginTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} ref={formRef} autoComplete="off">
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              placeholder={t('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group password-group">
            <label>{t('password')}</label>
            <input
              ref={passwordInputRef}
              type={showPassword ? "text" : "password"}
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="password-input"
            />
            <button
              ref={toggleBtnRef}
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button type="submit" className="submit-btn">{t('loginButton')}</button>
        </form>
        <p className="auth-link">
          {t('noAccount')} <Link to="/register">{t('signupHere')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
