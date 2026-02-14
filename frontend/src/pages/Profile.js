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
import MyTeam from '../components/MyTeam';
import ReviewManagement from '../components/ReviewManagement';
import StaffManagement from '../components/StaffManagement';
import { getRankImage, getRankName } from '../utils/rankHelpers';
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

  // State for profit periods
  const [profitPeriods, setProfitPeriods] = useState([]);
  const [loadingProfits, setLoadingProfits] = useState(false);

  // State for team points view
  const [teamData, setTeamData] = useState(null);
  const [pointsView, setPointsView] = useState('monthly'); // 'monthly' or 'cumulative'
  const [loadingTeam, setLoadingTeam] = useState(false);

  // State for expected profit (profits not yet calculated by admin)
  const [expectedProfit, setExpectedProfit] = useState(null);
  const [loadingExpectedProfit, setLoadingExpectedProfit] = useState(false);

  // Fetch fresh user data when component mounts
  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch profit periods when earnings tab is active and user is a member
  useEffect(() => {
    if (activeTab === 'earnings' && user?.role === 'member') {
      fetchProfitPeriods();
      fetchTeamData();
      fetchExpectedProfit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.role]);

  const fetchProfitPeriods = async () => {
    try {
      setLoadingProfits(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profit-periods/my-profits', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProfitPeriods(response.data.data.periods || []);
      }
    } catch (err) {
      console.error('Error fetching profit periods:', err);
    } finally {
      setLoadingProfits(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoadingTeam(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/team/my-team', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTeamData(response.data);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchExpectedProfit = async () => {
    try {
      setLoadingExpectedProfit(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/member/expected-profit', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setExpectedProfit(response.data.expectedProfit);
      }
    } catch (err) {
      console.error('Error fetching expected profit:', err);
    } finally {
      setLoadingExpectedProfit(false);
    }
  };

  // Calculate cumulative points for each generation level
  const getGenerationCumulativePoints = (level) => {
    if (!teamData || !teamData.team) return 0;

    // Sum up the cumulative points (user.points) of all members in this generation level
    const membersInLevel = teamData.team.filter(member => member.level === level);
    const totalPoints = membersInLevel.reduce((sum, member) => sum + (member.points || 0), 0);

    return totalPoints;
  };

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

          {/* Category Admin Tabs */}
          {user.role === 'category_admin' && (
            <button
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span className="tab-icon">📦</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}</span>
            </button>
          )}

          {user.role === 'category_admin' && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="tab-icon">📋</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة الطلبات' : 'Manage Orders'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">{language === 'ar' ? 'الإحصائيات' : 'Statistics'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'admin_secretary') && (
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
              <span className="tab-label">{language === 'ar' ? 'رتب جيناي' : 'Jenai Ranks'}</span>
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

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <span className="tab-icon">👨‍💼</span>
              <span className="tab-label">{language === 'ar' ? 'الموظفون' : 'Staff'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'sales_employee') && (
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="tab-icon">📦</span>
              <span className="tab-label">{language === 'ar' ? 'إدارة الطلبات' : 'Orders'}</span>
            </button>
          )}

          {(user.role === 'super_admin' || user.role === 'regional_admin') && (
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span className="tab-icon">⭐</span>
              <span className="tab-label">{language === 'ar' ? 'التقييمات' : 'Reviews'}</span>
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

          {(user.role === 'member' || user.role === 'subscriber') && (
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
            <form onSubmit={handleUpdateProfile} className="edit-form" autoComplete="off">
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
                  {user.role === 'super_admin'
                    ? language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'
                    : user.role === 'regional_admin'
                    ? language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'
                    : user.role === 'category_admin'
                    ? language === 'ar' ? 'مدير قسم' : 'Category Admin'
                    : user.role === 'sales_employee'
                    ? language === 'ar' ? 'موظف مبيعات' : 'Sales Employee'
                    : user.role === 'admin_secretary'
                    ? language === 'ar' ? 'سكرتير إدارة' : 'Admin Secretary'
                    : user.role === 'member'
                    ? language === 'ar' ? 'عضو' : 'Member'
                    : user.role === 'supplier'
                    ? language === 'ar' ? 'مورد' : 'Supplier'
                    : user.role === 'subscriber'
                    ? language === 'ar' ? 'مشترك' : 'Subscriber'
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

              {/* Referral Section for Members */}
              {user.role === 'member' && user.subscriberCode && (
                <div className="referral-section">
                  <h4 className="referral-title">
                    🔗 {language === 'ar' ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
                  </h4>
                  <div className="referral-box">
                    <div className="referral-link-container">
                      <input
                        type="text"
                        readOnly
                        value={user.referralLink || `${window.location.origin}/register?ref=${user.subscriberCode}`}
                        className="referral-link-input"
                      />
                      <button
                        className="copy-link-btn"
                        onClick={() => {
                          const link = user.referralLink || `${window.location.origin}/register?ref=${user.subscriberCode}`;
                          navigator.clipboard.writeText(link);
                          setMessage(language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
                          setTimeout(() => setMessage(''), 2000);
                        }}
                      >
                        📋 {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                      </button>
                    </div>
                    <p className="referral-hint">
                      {language === 'ar'
                        ? 'شارك هذا الرابط مع أصدقائك للانضمام تحت إحالتك'
                        : 'Share this link with friends to join under your referral'}
                    </p>
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
          {activeTab === 'users' && (user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'admin_secretary') && (
            <div className="tab-panel">
              <UserManagement />
            </div>
          )}

          {/* Products Management Tab */}
          {activeTab === 'products' && (user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'category_admin') && (
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

          {/* Staff Management Tab - For Super Admin */}
          {activeTab === 'staff' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <StaffManagement />
            </div>
          )}

          {/* Orders Management Tab - For Admins */}
          {activeTab === 'orders' && (user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'category_admin' || user.role === 'sales_employee') && (
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

          {/* Reviews Management Tab - For Admins */}
          {activeTab === 'reviews' && (user.role === 'super_admin' || user.role === 'regional_admin') && (
            <div className="tab-panel">
              <ReviewManagement />
            </div>
          )}

          {/* My Team Tab - For Members and Subscribers */}
          {activeTab === 'team' && (user.role === 'member' || user.role === 'subscriber') && (
            <div className="tab-panel">
              <MyTeam />
            </div>
          )}

          {/* My Earnings Tab - For Members */}
          {activeTab === 'earnings' && user.role === 'member' && (
            <div className="tab-panel">
              <div className="earnings-section">
                <h2>{language === 'ar' ? 'أرباحي' : 'My Earnings'}</h2>
                <div className="earnings-cards two-cards">
                  <div className="earning-card total">
                    <div className="earning-icon">💰</div>
                    <div className="earning-info">
                      <div className="earning-label">{language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}</div>
                      <div className="earning-subtitle">
                        {language === 'ar' ? 'من جميع دورات الأرباح المحتسبة' : 'From all calculated profit periods'}
                      </div>
                      <div className="earning-value">
                        ₪{profitPeriods.length > 0
                          ? profitPeriods.reduce((sum, p) => sum + (p.profit?.totalProfit || 0), 0).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="earning-card expected">
                    <div className="earning-icon">📊</div>
                    <div className="earning-info">
                      <div className="earning-label">{language === 'ar' ? 'الأرباح المتوقعة' : 'Expected Earnings'}</div>
                      <div className="earning-subtitle">
                        {language === 'ar' ? 'أرباح غير محتسبة بعد من الأدمن' : 'Not yet calculated by admin'}
                      </div>
                      <div className="earning-value">
                        {loadingExpectedProfit ? (
                          <span style={{ fontSize: '14px' }}>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                        ) : (
                          <>₪{expectedProfit?.finalExpectedProfit?.toFixed(2) || '0.00'}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points View Toggle */}
                <div className="points-toggle-container">
                  <button
                    className={`points-toggle-btn ${pointsView === 'cumulative' ? 'active' : ''}`}
                    onClick={() => setPointsView('cumulative')}
                  >
                    {language === 'ar' ? '📈 تراكمي' : '📈 Cumulative'}
                  </button>
                  <button
                    className={`points-toggle-btn ${pointsView === 'monthly' ? 'active' : ''}`}
                    onClick={() => setPointsView('monthly')}
                  >
                    {language === 'ar' ? '📊 نقاطي' : '📊 My Points'}
                  </button>
                </div>

                <div className="points-section">
                  <h3>{language === 'ar' ? 'النقاط' : 'Points'}</h3>
                  <div className="points-grid">
                    {/* Show personal performance points only in "نقاطي" view */}
                    {pointsView === 'monthly' && (
                      <div className="point-card">
                        <div className="point-label">
                          {language === 'ar' ? 'نقاط الأداء الشخصي' : 'Personal Performance Points'}
                        </div>
                        <div className="point-value">
                          {user.monthlyPoints || 0}
                        </div>
                      </div>
                    )}
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.monthlyPoints || 0) +
                            (user.generation1Points ? Math.floor(user.generation1Points / 0.11) : 0) +
                            (user.generation2Points ? Math.floor(user.generation2Points / 0.08) : 0) +
                            (user.generation3Points ? Math.floor(user.generation3Points / 0.06) : 0) +
                            (user.generation4Points ? Math.floor(user.generation4Points / 0.03) : 0) +
                            (user.generation5Points ? Math.floor(user.generation5Points / 0.02) : 0)
                          : (user.points || 0)}
                      </div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'نقاط الجيل الأول' : 'Generation 1 Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.generation1Points ? Math.floor(user.generation1Points / 0.11) : 0)
                          : getGenerationCumulativePoints(1)}
                      </div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'نقاط الجيل الثاني' : 'Generation 2 Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.generation2Points ? Math.floor(user.generation2Points / 0.08) : 0)
                          : getGenerationCumulativePoints(2)}
                      </div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'نقاط الجيل الثالث' : 'Generation 3 Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.generation3Points ? Math.floor(user.generation3Points / 0.06) : 0)
                          : getGenerationCumulativePoints(3)}
                      </div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'نقاط الجيل الرابع' : 'Generation 4 Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.generation4Points ? Math.floor(user.generation4Points / 0.03) : 0)
                          : getGenerationCumulativePoints(4)}
                      </div>
                    </div>
                    <div className="point-card">
                      <div className="point-label">
                        {language === 'ar' ? 'نقاط الجيل الخامس' : 'Generation 5 Points'}
                      </div>
                      <div className="point-value">
                        {pointsView === 'monthly'
                          ? (user.generation5Points ? Math.floor(user.generation5Points / 0.02) : 0)
                          : getGenerationCumulativePoints(5)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="member-rank-info">
                  <h3>{language === 'ar' ? 'معلومات الرتبة' : 'Rank Information'}</h3>
                  <div className="rank-display">
                    <img
                      src={`/${getRankImage(user.memberRank || 'agent')}`}
                      alt={getRankName(user.memberRank || 'agent', language)}
                      className="rank-image"
                      style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '10px' }}
                    />
                    <span className="rank-badge">{getRankName(user.memberRank || 'agent', language)}</span>
                  </div>
                </div>

                {/* دورات الأرباح المحتسبة */}
                <div className="profit-periods-section">
                  <h3>{language === 'ar' ? 'دورات الأرباح المحتسبة' : 'Calculated Profit Periods'}</h3>

                  {loadingProfits ? (
                    <div className="loading-profits">
                      <div className="spinner"></div>
                      <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                  ) : profitPeriods.length === 0 ? (
                    <div className="no-profit-periods">
                      <div className="empty-icon">📊</div>
                      <p>{language === 'ar' ? 'لم يتم احتساب أي دورة أرباح بعد' : 'No profit periods calculated yet'}</p>
                    </div>
                  ) : (
                    <div className="profit-periods-table-container">
                      <table className="profit-periods-table">
                        <thead>
                          <tr>
                            <th>{language === 'ar' ? '#' : '#'}</th>
                            <th>{language === 'ar' ? 'اسم الدورة' : 'Period Name'}</th>
                            <th>{language === 'ar' ? 'رقم الدورة' : 'Period Number'}</th>
                            <th>{language === 'ar' ? 'أرباح الأداء' : 'Performance Profit'}</th>
                            <th>{language === 'ar' ? 'أرباح الأجيال' : 'Generations Profit'}</th>
                            <th>{language === 'ar' ? 'أرباح القيادة' : 'Leadership Profit'}</th>
                            <th>{language === 'ar' ? 'عمولة شراء زبون' : 'Customer Comm'}</th>
                            <th>{language === 'ar' ? 'قبل الخصم' : 'Before Deduction'}</th>
                            <th>{language === 'ar' ? 'خصم الموقع 3%' : 'Site Deduction 3%'}</th>
                            <th>{language === 'ar' ? 'الناتج النهائي' : 'Final Total'}</th>
                            <th>{language === 'ar' ? 'تاريخ الاحتساب' : 'Calculated Date'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profitPeriods.map((period, index) => {
                            // حساب العمولات من النقاط مباشرة (نفس منطق صفحة الإدارة)
                            const personalPts = period.profit?.points?.personal || 0;
                            const gen1Pts = period.profit?.points?.generation1 || 0;
                            const gen2Pts = period.profit?.points?.generation2 || 0;
                            const gen3Pts = period.profit?.points?.generation3 || 0;
                            const gen4Pts = period.profit?.points?.generation4 || 0;
                            const gen5Pts = period.profit?.points?.generation5 || 0;
                            const teamPts = gen1Pts + gen2Pts + gen3Pts + gen4Pts + gen5Pts;

                            const personalComm = Math.floor(personalPts * 0.20 * 0.55);
                            const teamComm = Math.floor(teamPts * 0.55);
                            const leadProfit = Math.floor(period.profit?.leadershipProfit || 0);
                            const customerCommission = period.profit?.customerPurchaseCommission || 0;

                            // البيانات من الباك اند (تتضمن الخصم)
                            const totalBeforeDeduction = period.profit?.totalProfitBeforeDeduction || (personalComm + teamComm + leadProfit + customerCommission);
                            const websiteCommission = period.profit?.websiteDevelopmentCommission || 0;
                            const finalProfit = period.profit?.totalProfit || 0;

                            return (
                              <tr key={period.periodId}>
                                <td>{index + 1}</td>
                                <td className="period-name">{period.periodName}</td>
                                <td className="period-number">{period.periodNumber}</td>
                                <td className="profit-value">
                                  ₪{personalComm}
                                </td>
                                <td className="profit-value">
                                  ₪{teamComm}
                                </td>
                                <td className="profit-value">
                                  ₪{leadProfit}
                                </td>
                                <td className="profit-value" style={{color: '#27ae60'}}>
                                  ₪{customerCommission.toFixed(2)}
                                </td>
                                <td className="profit-value">
                                  ₪{totalBeforeDeduction.toFixed(2)}
                                </td>
                                <td className="profit-value" style={{color: '#e74c3c'}}>
                                  -₪{websiteCommission.toFixed(2)}
                                </td>
                                <td className="profit-value total-profit" style={{fontWeight: 'bold'}}>
                                  ₪{finalProfit}
                                </td>
                                <td className="calculated-date">
                                  {new Date(period.calculatedAt).toLocaleDateString(
                                    language === 'ar' ? 'ar-EG' : 'en-US',
                                    { year: 'numeric', month: 'short', day: 'numeric' }
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
            <form onSubmit={handlePasswordChange} className="password-form" autoComplete="off">
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
