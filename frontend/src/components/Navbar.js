import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getCategories } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isSubscriber, isSupplier } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const productsMenuTimeout = useRef(null);

  const handleProductsEnter = () => {
    clearTimeout(productsMenuTimeout.current);
    setShowProductsMenu(true);
  };

  const handleProductsLeave = () => {
    productsMenuTimeout.current = setTimeout(() => {
      setShowProductsMenu(false);
    }, 150);
  };

  useEffect(() => {
    fetchCategories();
    if (isAuthenticated) {
      // TODO: Fetch notifications from API
      // Mock data for now
      setNotifications([
        { _id: '1', title: 'Welcome!', message: 'Welcome to Jenai', isRead: false },
        { _id: '2', title: 'New Order', message: 'Your order has been confirmed', isRead: false }
      ]);
      setUnreadCount(2);
    }
  }, [isAuthenticated]);

  // Refresh categories when products menu is opened
  useEffect(() => {
    if (showProductsMenu) {
      fetchCategories();
    }
  }, [showProductsMenu]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      // Ensure categories is always an array of objects with proper structure
      const categoriesData = (data.categories || []).map(cat => {
        if (typeof cat === 'string') {
          return { name: cat, nameAr: cat, nameEn: cat, image: '' };
        }
        return {
          ...cat,
          name: cat.name || cat.nameAr || cat.nameEn || '',
          nameAr: cat.nameAr || cat.name || '',
          nameEn: cat.nameEn || cat.name || ''
        };
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setShowProductsMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="Jenai" className="logo-image" />
          </Link>

          {isAuthenticated && (
            <Link to="/profile" className="nav-link profile-link desktop-only">
              👤 {user?.name || (language === 'ar' ? 'الحساب' : 'Profile')}
            </Link>
          )}
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`mobile-dropdown ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-center">
          <ul className="nav-main-links">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeMobileMenu}>{t('home')}</Link>
            </li>

            {/* Products Dropdown */}
            <li
              className="nav-item dropdown"
              onMouseEnter={handleProductsEnter}
              onMouseLeave={handleProductsLeave}
            >
              <span
                className="nav-link"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowProductsMenu(!showProductsMenu)}
              >
                {language === 'ar' ? 'المنتجات' : 'Products'} ▾
              </span>
              {showProductsMenu && (
                <div
                  className="dropdown-menu"
                  onMouseEnter={handleProductsEnter}
                  onMouseLeave={handleProductsLeave}
                >
                  <Link
                    to="/products-page?filter=new"
                    className="dropdown-item"
                    onClick={closeMobileMenu}
                  >
                    {language === 'ar' ? 'وصل حديثاً' : 'New Arrivals'}
                  </Link>
                  <Link
                    to="/products-page?filter=offers"
                    className="dropdown-item"
                    onClick={closeMobileMenu}
                  >
                    {language === 'ar' ? 'قسم العروض' : 'Offers Section'}
                  </Link>
                  <Link
                    to="/products-page"
                    className="dropdown-item"
                    onClick={closeMobileMenu}
                  >
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </Link>
                  {categories.length > 0 && (
                    <>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-header">
                        {language === 'ar' ? 'الأقسام' : 'Categories'}
                      </div>
                      {categories.map((category, index) => (
                        <Link
                          key={index}
                          to={`/products-page?category=${encodeURIComponent(category.name)}`}
                          className="dropdown-item"
                          onClick={closeMobileMenu}
                        >
                          {language === 'ar' ? category.nameAr : category.nameEn}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </li>

            {(isSubscriber || isAdmin) && (
              <li className="nav-item">
                <Link to="/academy" className="nav-link" onClick={closeMobileMenu}>
                  🎓 {language === 'ar' ? 'أكاديمية جيناي' : 'Jenai Academy'}
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link to="/news" className="nav-link" onClick={closeMobileMenu}>
                📰 {language === 'ar' ? 'أخبار جيناي' : 'Jenai News'}
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/services" className="nav-link" onClick={closeMobileMenu}>{language === 'ar' ? 'الخدمات' : 'Services'}</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link" onClick={closeMobileMenu}>{language === 'ar' ? 'من نحن' : 'About Us'}</Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>{language === 'ar' ? 'اتصل بنا' : 'Contact Us'}</Link>
            </li>

            {/* Profile link for mobile */}
            {isAuthenticated && (
              <li className="nav-item mobile-only">
                <Link to="/profile" className="nav-link profile-link-mobile" onClick={closeMobileMenu}>
                  👤 {user?.name || (language === 'ar' ? 'الحساب' : 'Profile')}
                </Link>
              </li>
            )}
          </ul>
        </div>

        <ul className="nav-menu">
          {isAuthenticated ? (
            <>
              {isSupplier && (
                <li className="nav-item">
                  <Link to="/supplier-dashboard" className="nav-link">
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                </li>
              )}


              {user?.role === 'super_admin' && (
                <li className="nav-item">
                  <Link to="/suppliers" className="nav-link">
                    {language === 'ar' ? 'الموردين' : 'Suppliers'}
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link to="/favorites" className="nav-link favorites-link" onClick={closeMobileMenu}>
                  ❤️ {language === 'ar' ? 'المفضلة' : 'Favorites'}
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>
                  {t('cart')} ({getCartCount()})
                </Link>
              </li>

              <li className="nav-item">
                <LanguageSwitcher />
              </li>

              <li className="nav-item">
                <button onClick={() => { logout(); closeMobileMenu(); }} className="nav-button">{t('logout')}</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/cart" className="nav-link" onClick={closeMobileMenu}>
                  {t('cart')} ({getCartCount()})
                </Link>
              </li>
              <li className="nav-item">
                <LanguageSwitcher />
              </li>
              <li className="nav-item">
                <Link to="/login" className="nav-button" onClick={closeMobileMenu}>{t('login')}</Link>
              </li>
            </>
          )}
        </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
