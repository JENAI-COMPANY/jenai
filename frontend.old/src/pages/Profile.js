import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import Statistics from '../components/Statistics';
import UserManagement from '../components/UserManagement';
import OrderManagement from '../components/OrderManagement';
import MyOrders from '../components/MyOrders';
import ProductManagement from '../components/ProductManagement';
import SliderManagement from '../components/SliderManagement';
import ServicesManagement from './ServicesManagement';
import SuppliersManagement from '../components/SuppliersManagement';
import MembersManagement from '../components/MembersManagement';
import MemberRanks from '../components/MemberRanks';
import ProfitCalculation from '../components/ProfitCalculation';
import RegionsManagement from '../components/RegionsManagement';
import PermissionsManagement from '../components/PermissionsManagement';
import CategoryManagement from '../components/CategoryManagement';
import '../styles/Profile.css';

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const { language } = useLanguage();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  // Fetch fresh user data when component mounts
  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/auth/profile',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage(language === 'ar' ? 'تم تحديث المعلومات بنجاح!' : 'Profile updated successfully!');
        setIsEditing(false);
        fetchUser(); // Refresh user data
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تحديث المعلومات' : 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور الجديدة غير متطابقة' : 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{language === 'ar' ? 'معلومات الحساب' : 'Account Information'}</h1>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="profile-layout">
        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
          </button>

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">{language === 'ar' ? 'الإحصائيات' : 'Statistics'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة المستخدمين' : 'Users'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span className="tab-icon">📦</span>
              <span className="tab-label">{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'sliders' ? 'active' : ''}`}
              onClick={() => setActiveTab('sliders')}
            >
              <span className="tab-icon">🖼️</span>
              <span className="tab-label">{language === 'ar' ? 'صور الواجهة' : 'Sliders'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <span className="tab-icon">📋</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة الخدمات' : 'Services'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
              onClick={() => setActiveTab('suppliers')}
            >
              <span className="tab-icon">🏭</span>
              <span className="tab-label">{language === 'ar' ? 'الموردين' : 'Suppliers'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <span className="tab-icon">👨‍💼</span>
              <span className="tab-label">{language === 'ar' ? 'الأعضاء' : 'Members'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'ranks' ? 'active' : ''}`}
              onClick={() => setActiveTab('ranks')}
            >
              <span className="tab-icon">🏆</span>
              <span className="tab-label">{language === 'ar' ? 'الرتب التسع' : '9 Ranks'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'profit' ? 'active' : ''}`}
              onClick={() => setActiveTab('profit')}
            >
              <span className="tab-icon">💰</span>
              <span className="tab-label">{language === 'ar' ? 'احتساب الأرباح' : 'Profit Calculation'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'regions' ? 'active' : ''}`}
              onClick={() => setActiveTab('regions')}
            >
              <span className="tab-icon">🌍</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة المناطق' : 'Regions'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <span className="tab-icon">🔐</span>
              <span className="tab-label">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <span className="tab-icon">📂</span>
              <span className="tab-label">{language === 'ar' ? 'الأقسام' : 'Categories'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="tab-icon">📦</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة الطلبات' : 'Orders'}</span>
            </button>
          )}

          {(user.role === 'customer' || user.role === 'subscriber' || user.role === 'member') && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="tab-icon">📦</span>
              <span className="tab-label">{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
            </button>
          )}

          {user.role === 'member' && (
            <button
              className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-label">{language === 'ar' ? 'فريقي' : 'My Team'}</span>
            </button>
          )}

          {user.role === 'member' && (
            <button
              className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <span className="tab-icon">💰</span>
              <span className="tab-label">{language === 'ar' ? 'أرباحي' : 'My Earnings'}</span>
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="tab-icon">🔒</span>
            <span className="tab-label">{language === 'ar' ? 'الأمان' : 'Security'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-panel">
              {/* Personal Information */}
              <div className="info-section">
          <div className="section-header">
            <h2>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</h2>
            {(user.role === 'super_admin' || user.role === 'regional_admin') && !isEditing && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
            )}
          </div>

          {isEditing && (user.role === 'super_admin' || user.role === 'regional_admin') ? (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="info-grid">
                <div className="info-item">
                  <label>{language === 'ar' ? 'الاسم:' : 'Name:'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="info-item">
                  <label>{language === 'ar' ? 'اسم المستخدم:' : 'Username:'}</label>
                  <div className="info-value">{user.username}</div>
                </div>

                <div className="info-item">
                  <label>{language === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || '',
                      phone: user.phone || ''
                    });
                    setError('');
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <label>{language === 'ar' ? 'الاسم:' : 'Name:'}</label>
                <div className="info-value">{user.name}</div>
              </div>

              <div className="info-item">
                <label>{language === 'ar' ? 'اسم المستخدم:' : 'Username:'}</label>
                <div className="info-value">{user.username}</div>
              </div>

              <div className="info-item">
                <label>{language === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</label>
                <div className="info-value">{user.phone}</div>
              </div>

              <div className="info-item">
                <label>{language === 'ar' ? 'نوع الحساب:' : 'Account Type:'}</label>
                <div className="info-value role-badge">
                  {user.role === 'subscriber'
                    ? language === 'ar' ? 'مشترك' : 'Subscriber'
                    : user.role === 'super_admin'
                    ? language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'
                    : user.role === 'regional_admin'
                    ? language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'
                    : language === 'ar' ? 'عميل' : 'Customer'}
                </div>
              </div>

              {user.subscriberId && (
                <div className="info-item">
                  <label>{language === 'ar' ? 'رقم المشترك:' : 'Subscriber ID:'}</label>
                  <div className="info-value subscriber-id">{user.subscriberId}</div>
                </div>
              )}

              {user.subscriberCode && (
                <div className="info-item">
                  <label>{language === 'ar' ? 'كود المشترك:' : 'Subscriber Code:'}</label>
                  <div className="info-value subscriber-id">{user.subscriberCode}</div>
                </div>
              )}

              {user.referralCode && (
                <div className="info-item">
                  <label>{language === 'ar' ? 'كود الإحالة المستخدم:' : 'Reference Code Used:'}</label>
                  <div className="info-value">{user.referralCode}</div>
                </div>
              )}

              {user.country && (
                <div className="info-item">
                  <label>{language === 'ar' ? 'الدولة:' : 'Country:'}</label>
                  <div className="info-value">{user.country}</div>
                </div>
              )}

              {user.city && (
                <div className="info-item">
                  <label>{language === 'ar' ? 'المدينة:' : 'City:'}</label>
                  <div className="info-value">{user.city}</div>
                </div>
              )}

              {user.referralLink && (
                <div className="info-item full-width">
                  <label>{language === 'ar' ? 'رابط الإحالة:' : 'Referral Link:'}</label>
                  <div className="info-value referral-link">
                    {user.referralLink}
                    <button
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(user.referralLink);
                        setMessage(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                        setTimeout(() => setMessage(''), 2000);
                      }}
                    >
                      📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {user.sponsorId && (
                <div className="info-item full-width">
                  <label>{language === 'ar' ? 'كود الراعي:' : 'Sponsor Code:'}</label>
                  <div className="info-value sponsor-info">
                    <span className="sponsor-name">{user.sponsorId.name}</span>
                    {user.sponsorId.subscriberCode && (
                      <span className="sponsor-code">{user.sponsorId.subscriberCode}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning message - only show for non-admin users */}
          {user.role !== 'super_admin' && user.role !== 'regional_admin' && (
            <div className="info-note">
              <p>
                {language === 'ar'
                  ? '⚠️ لا يمكن تعديل المعلومات الشخصية. للتغيير، يرجى التواصل مع الدعم.'
                  : '⚠️ Personal information cannot be edited. Please contact support to make changes.'}
              </p>
            </div>
          )}
          </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <Statistics />
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <UserManagement />
            </div>
          )}

          {/* Products Management Tab */}
          {activeTab === 'products' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <ProductManagement />
            </div>
          )}

          {/* Sliders Management Tab */}
          {activeTab === 'sliders' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <SliderManagement />
            </div>
          )}

          {/* Services Management Tab */}
          {activeTab === 'services' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <ServicesManagement />
            </div>
          )}

          {/* Suppliers Management Tab */}
          {activeTab === 'suppliers' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <SuppliersManagement />
            </div>
          )}

          {/* Members Management Tab */}
          {activeTab === 'members' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <MembersManagement />
            </div>
          )}

          {/* Member Ranks Tab */}
          {activeTab === 'ranks' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <MemberRanks />
            </div>
          )}

          {/* Profit Calculation Tab */}
          {activeTab === 'profit' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <ProfitCalculation />
            </div>
          )}

          {/* Regions Management Tab - For Super Admin */}
          {activeTab === 'regions' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <RegionsManagement />
            </div>
          )}

          {/* Permissions Management Tab - For Super Admin */}
          {activeTab === 'permissions' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <PermissionsManagement />
            </div>
          )}

          {/* Category Management Tab - For Super Admin */}
          {activeTab === 'categories' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <CategoryManagement />
            </div>
          )}

          {/* Orders Management Tab - For Admins */}
          {activeTab === 'orders' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <OrderManagement />
            </div>
          )}

          {/* My Orders Tab - For Customers, Subscribers, and Members */}
          {activeTab === 'orders' && (user.role === 'customer' || user.role === 'subscriber' || user.role === 'member') && (
            <div className="tab-panel">
              <MyOrders />
            </div>
          )}

          {/* My Team Tab - For Members */}
          {activeTab === 'team' && user.role === 'member' && (
            <div className="tab-panel">
              <div className="team-section">
                <h2>{language === 'ar' ? 'فريقي' : 'My Team'}</h2>
                <div className="team-stats">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <div className="stat-label">{language === 'ar' ? 'إجمالي الفريق' : 'Total Team'}</div>
                      <div className="stat-value">{user.downline?.length || 0}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                      <div className="stat-label">{language === 'ar' ? 'الإحالات المباشرة' : 'Direct Referrals'}</div>
                      <div className="stat-value">{user.memberReferrals || 0}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-info">
                      <div className="stat-label">{language === 'ar' ? 'إحالات العملاء' : 'Customer Referrals'}</div>
                      <div className="stat-value">{user.customerReferrals || 0}</div>
                    </div>
                  </div>
                </div>

                {user.memberReferralLink && (
                  <div className="referral-links-section">
                    <h3>{language === 'ar' ? 'روابط الإحالة' : 'Referral Links'}</h3>
                    <div className="referral-link-box">
                      <label>{language === 'ar' ? 'رابط إحالة الأعضاء' : 'Member Referral Link'}</label>
                      <div className="link-container">
                        <input type="text" value={user.memberReferralLink} readOnly />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.memberReferralLink);
                            setMessage(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                            setTimeout(() => setMessage(''), 2000);
                          }}
                        >
                          📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    {user.customerReferralLink && (
                      <div className="referral-link-box">
                        <label>{language === 'ar' ? 'رابط إحالة العملاء' : 'Customer Referral Link'}</label>
                        <div className="link-container">
                          <input type="text" value={user.customerReferralLink} readOnly />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.customerReferralLink);
                              setMessage(language === 'ar' ? 'تم النسخ!' : 'Copied!');
                              setTimeout(() => setMessage(''), 2000);
                            }}
                          >
                            📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Earnings Tab - For Members */}
          {activeTab === 'earnings' && user.role === 'member' && (
            <div className="tab-panel">
              <div className="earnings-section">
                <h2>{language === 'ar' ? 'أرباحي' : 'My Earnings'}</h2>
                <div className="earnings-cards">
                  <div className="earning-card total">
                    <div className="earning-icon">💰</div>
                    <div className="earning-info">
                      <div className="earning-label">{language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}</div>
                      <div className="earning-value">₪{(user.totalCommission || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="earning-card available">
                    <div className="earning-icon">💵</div>
                    <div className="earning-info">
                      <div className="earning-label">{language === 'ar' ? 'الأرباح المتاحة' : 'Available Earnings'}</div>
                      <div className="earning-value">₪{(user.availableCommission || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="earning-card withdrawn">
                    <div className="earning-icon">💸</div>
                    <div className="earning-info">
                      <div className="earning-label">{language === 'ar' ? 'الأرباح المسحوبة' : 'Withdrawn Earnings'}</div>
                      <div className="earning-value">₪{(user.withdrawnCommission || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="points-section">
                  <h3>{language === 'ar' ? 'النقاط' : 'Points'}</h3>
                  <div className="points-grid">
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'النقاط الشهرية' : 'Monthly Points'}</div>
                      <div className="point-value">{user.monthlyPoints || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}</div>
                      <div className="point-value">{user.points || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'نقاط الجيل الأول' : 'Generation 1 Points'}</div>
                      <div className="point-value">{user.generation1Points || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'نقاط الجيل الثاني' : 'Generation 2 Points'}</div>
                      <div className="point-value">{user.generation2Points || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'نقاط الجيل الثالث' : 'Generation 3 Points'}</div>
                      <div className="point-value">{user.generation3Points || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'نقاط الجيل الرابع' : 'Generation 4 Points'}</div>
                      <div className="point-value">{user.generation4Points || 0}</div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">{language === 'ar' ? 'نقاط الجيل الخامس' : 'Generation 5 Points'}</div>
                      <div className="point-value">{user.generation5Points || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="member-rank-info">
                  <h3>{language === 'ar' ? 'معلومات الرتبة' : 'Rank Information'}</h3>
                  <div className="rank-display">
                    <span className="rank-badge">{user.memberRank || 'agent'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-panel">
              {/* Password Change Section */}
              <div className="password-section">
          <h2>{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h2>

          {!showPasswordForm ? (
            <button
              className="change-password-btn"
              onClick={() => setShowPasswordForm(true)}
            >
              {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>{language === 'ar' ? 'كلمة المرور الحالية:' : 'Current Password:'}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                />
              </div>

              <div className="form-group">
                <label>{language === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                />
              </div>

              <div className="form-group">
                <label>{language === 'ar' ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                  placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}
        </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
