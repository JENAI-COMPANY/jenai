import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import AcademyManagement from '../components/AcademyManagement';
import VerificationModal from '../components/VerificationModal';
import VerificationManagement from '../components/VerificationManagement';
import { getRankImage, getRankName } from '../utils/rankHelpers';
import '../styles/Profile.css';
import '../styles/Verification.css';

// ── Rewards Panel Component ─────────────────────────────────────────
const RewardsPanel = ({ language }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRewards('');
  }, []);

  const fetchRewards = async (term) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = term ? `?search=${encodeURIComponent(term)}` : '';
      const res = await axios.get(`/api/admin/rewards${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(res.data.rewards || []);
    } catch (e) {
      setRewards([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchRewards(val);
  };

  return (
    <div className="tab-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, color: '#ff9800' }}>🎁 {language === 'ar' ? 'سجل المكافآت' : 'Rewards Log'}</h3>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder={language === 'ar' ? 'بحث بالاسم أو الكود أو اليوزر...' : 'Search by name, code or username...'}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #ddd', minWidth: '250px', fontSize: '14px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : rewards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          {language === 'ar' ? 'لا توجد مكافآت' : 'No rewards found'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#fff8e1', borderBottom: '2px solid #ff9800' }}>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'العضو' : 'Member'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'كود العضوية' : 'Code'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'اليوزرنيم' : 'Username'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'السبب' : 'Reason'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'بواسطة' : 'By'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r, i) => (
                <tr key={r._id} style={{ background: i % 2 === 0 ? '#fff' : '#fffdf5', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>{r.user?.name || '-'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#1a7a3c' }}>{r.user?.subscriberCode || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#666' }}>@{r.user?.username || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#ff9800', color: '#fff', borderRadius: '20px', padding: '3px 12px', fontWeight: 'bold', fontSize: '13px' }}>
                      +{r.amount}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#555' }}>{r.reason || <span style={{ color: '#bbb' }}>—</span>}</td>
                  <td style={{ padding: '10px 12px', color: '#888', fontSize: '12px' }}>{r.addedBy?.name || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#888', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
// ───────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const openVerification = () => {
    if (window.innerWidth <= 1024) {
      navigate('/verify');
    } else {
      setShowVerificationModal(true);
    }
  };

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'profile');

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };
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

  // Verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [myVerification, setMyVerification] = useState(null);

  // Fetch fresh user data when component mounts
  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch my verification status for members
  useEffect(() => {
    if (user?.role === 'member') {
      const token = localStorage.getItem('token');
      axios.get('/api/verifications/my', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (res.data.success) setMyVerification(res.data.verification); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

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
    <>
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

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'verifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('verifications')}
            >
              <span className="tab-icon">🪪</span>
              <span className="tab-label">{language === 'ar' ? 'التوثيقات' : 'Verifications'}</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
              onClick={() => setActiveTab('rewards')}
            >
              <span className="tab-icon">🎁</span>
              <span className="tab-label">{language === 'ar' ? 'المكافآت' : 'Rewards'}</span>
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

          {user.role === 'super_admin' && (
            <button
              className={`tab-btn ${activeTab === 'academy' ? 'active' : ''}`}
              onClick={() => setActiveTab('academy')}
            >
              <span className="tab-icon">🎓</span>
              <span className="tab-label">{language === 'ar' ? 'الأكاديمية' : 'Academy'}</span>
            </button>
          )}
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

              {/* Referral Links for Members */}
              {user.role === 'member' && user.subscriberCode && (
                <div className="referral-section">
                  <h4 className="referral-title">
                    🔗 {language === 'ar' ? 'روابط الإحالة الخاصة بك' : 'Your Referral Links'}
                  </h4>

                  {/* Shopping Referral Link */}
                  <div className="referral-box" style={{ marginBottom: '16px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2196F3', fontSize: '14px', fontWeight: '600' }}>
                      🛒 {language === 'ar' ? 'رابط إحالة للتسوق' : 'Shopping Referral Link'}
                    </h5>
                    <div className="referral-link-container">
                      <input
                        type="text"
                        readOnly
                        value={`https://jenai-4u.com/register?ref=${user.subscriberCode}&type=customer`}
                        className="referral-link-input"
                      />
                      <button
                        className="copy-link-btn"
                        onClick={() => {
                          const link = `https://jenai-4u.com/register?ref=${user.subscriberCode}&type=customer`;
                          navigator.clipboard.writeText(link);
                          setMessage(language === 'ar' ? 'تم نسخ رابط التسوق!' : 'Shopping link copied!');
                          setTimeout(() => setMessage(''), 2000);
                        }}
                      >
                        📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                      </button>
                    </div>
                    <p className="referral-hint" style={{ fontSize: '12px', margin: '6px 0 0 0' }}>
                      {language === 'ar'
                        ? 'للعملاء الراغبين بالتسوق فقط'
                        : 'For customers who want to shop only'}
                    </p>
                  </div>

                  {/* Member Referral Link */}
                  <div className="referral-box">
                    <h5 style={{ margin: '0 0 10px 0', color: '#4CAF50', fontSize: '14px', fontWeight: '600' }}>
                      👥 {language === 'ar' ? 'رابط إحالة عضو' : 'Member Referral Link'}
                    </h5>
                    <div className="referral-link-container">
                      <input
                        type="text"
                        readOnly
                        value={`https://jenai-4u.com/register?ref=${user.subscriberCode}&type=member`}
                        className="referral-link-input"
                      />
                      <button
                        className="copy-link-btn"
                        onClick={() => {
                          const link = `https://jenai-4u.com/register?ref=${user.subscriberCode}&type=member`;
                          navigator.clipboard.writeText(link);
                          setMessage(language === 'ar' ? 'تم نسخ رابط العضوية!' : 'Member link copied!');
                          setTimeout(() => setMessage(''), 2000);
                        }}
                      >
                        📋 {language === 'ar' ? 'نسخ' : 'Copy'}
                      </button>
                    </div>
                    <p className="referral-hint" style={{ fontSize: '12px', margin: '6px 0 0 0' }}>
                      {language === 'ar'
                        ? 'للأشخاص الراغبين بالانضمام كأعضاء في الشبكة'
                        : 'For people who want to join as network members'}
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

          {/* Verification Section for Members */}
          {user.role === 'member' && (
            <div className="verification-section">
              <h4>🪪 {language === 'ar' ? 'توثيق الحساب' : 'Account Verification'}</h4>
              {user.isVerified ? (
                <div className="verification-status-card">
                  <span className="verification-badge">✓ {language === 'ar' ? 'حساب موثق' : 'Verified Account'}</span>
                  {myVerification && (
                    <div className="verification-approved-info">
                      <p><strong>{language === 'ar' ? 'الاسم الثلاثي:' : 'Full Name:'}</strong> {myVerification.fullName}</p>
                      <p><strong>{language === 'ar' ? 'نوع الوثيقة:' : 'Document:'}</strong> {myVerification.idType === 'national_id' ? (language === 'ar' ? 'هوية' : 'National ID') : (language === 'ar' ? 'جواز' : 'Passport')}</p>
                    </div>
                  )}
                </div>
              ) : myVerification?.status === 'pending' ? (
                <div className="verification-status-card">
                  <span className="verification-badge verification-badge-pending">⏳ {language === 'ar' ? 'طلب قيد المراجعة' : 'Pending Review'}</span>
                  <p style={{color:'#7f8c8d', fontSize:'0.875rem', marginTop:'0.5rem'}}>
                    {language === 'ar' ? 'سيتم مراجعة طلبك من قبل الإدارة' : 'Your request is being reviewed by admin'}
                  </p>
                </div>
              ) : myVerification?.status === 'rejected' ? (
                <div className="verification-status-card">
                  <span className="verification-badge verification-badge-rejected">✕ {language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                  {myVerification.adminNote && (
                    <div className="verification-reject-reason">
                      <strong>{language === 'ar' ? 'سبب الرفض:' : 'Reason:'}</strong> {myVerification.adminNote}
                    </div>
                  )}
                  <button className="verify-account-btn" onClick={openVerification}>
                    🔄 {language === 'ar' ? 'إعادة تقديم طلب التوثيق' : 'Re-submit Verification'}
                  </button>
                </div>
              ) : (
                <div className="verification-status-card">
                  <p style={{color:'#7f8c8d', fontSize:'0.875rem'}}>
                    {language === 'ar' ? 'وثّق حسابك للحصول على علامة الموثق' : 'Verify your account to get the verified badge'}
                  </p>
                  <button className="verify-account-btn" onClick={openVerification}>
                    🪪 {language === 'ar' ? 'توثيق الحساب' : 'Verify Account'}
                  </button>
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

          {/* Verifications Tab - Super Admin Only */}
          {activeTab === 'verifications' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <VerificationManagement language={language} />
            </div>
          )}

          {/* Rewards Tab - Super Admin Only */}
          {activeTab === 'rewards' && user.role === 'super_admin' && (
            <RewardsPanel language={language} />
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

          {/* Academy Management Tab - For Super Admin */}
          {activeTab === 'academy' && user.role === 'super_admin' && (
            <div className="tab-panel">
              <AcademyManagement />
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
                      style={{ width: '200px', height: '200px', objectFit: 'contain', marginBottom: '10px' }}
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
                    <div className="profit-periods-cards">
                      {profitPeriods.map((period, index) => {
                        const personalComm = Math.floor(period.profit?.personalProfit || 0);
                        const teamComm = Math.floor(period.profit?.teamProfit || 0);
                        const leadProfit = Math.floor(period.profit?.leadershipProfit || 0);
                        const customerCommission = period.profit?.customerPurchaseCommission || 0;
                        const totalBeforeDeduction = period.profit?.totalProfitBeforeDeduction || 0;
                        const websiteCommission = period.profit?.websiteDevelopmentCommission || 0;
                        const finalProfit = period.profit?.totalProfit || 0;

                        return (
                          <div key={period.periodId} className="profit-period-card">
                            <div className="ppc-header">
                              <span className="ppc-index">#{index + 1}</span>
                              <span className="ppc-name">{period.periodName}</span>
                              <span className="ppc-date">
                                {new Date(period.calculatedAt).toLocaleDateString(
                                  language === 'ar' ? 'ar-EG' : 'en-US',
                                  { year: 'numeric', month: 'short', day: 'numeric' }
                                )}
                              </span>
                            </div>
                            <div className="ppc-rows">
                              <div className="ppc-row">
                                <span className="ppc-label">{language === 'ar' ? 'أرباح شخصية' : 'Personal'}</span>
                                <span className="ppc-val">₪{personalComm}</span>
                              </div>
                              <div className="ppc-row">
                                <span className="ppc-label">{language === 'ar' ? 'عمولة الفريق' : 'Team Commission'}</span>
                                <span className="ppc-val">₪{teamComm}</span>
                              </div>
                              <div className="ppc-row">
                                <span className="ppc-label">{language === 'ar' ? 'عمولة القيادة' : 'Leadership'}</span>
                                <span className="ppc-val">₪{leadProfit}</span>
                              </div>
                              {customerCommission > 0 && (
                                <div className="ppc-row">
                                  <span className="ppc-label">{language === 'ar' ? 'عمولة شراء زبون' : 'Customer Comm'}</span>
                                  <span className="ppc-val" style={{color:'#27ae60'}}>₪{customerCommission.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="ppc-row ppc-divider">
                                <span className="ppc-label">{language === 'ar' ? 'قبل الخصم' : 'Before Deduction'}</span>
                                <span className="ppc-val">₪{totalBeforeDeduction.toFixed(2)}</span>
                              </div>
                              <div className="ppc-row">
                                <span className="ppc-label">{language === 'ar' ? 'خصم الموقع 3%' : 'Site 3%'}</span>
                                <span className="ppc-val" style={{color:'#e74c3c'}}>-₪{websiteCommission.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="ppc-footer">
                              <span>{language === 'ar' ? 'الناتج النهائي' : 'Final Total'}</span>
                              <span className="ppc-total">₪{finalProfit}</span>
                            </div>
                          </div>
                        );
                      })}
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

    {/* Verification Modal */}
    {showVerificationModal && (
      <VerificationModal
        language={language}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={() => {
          setShowVerificationModal(false);
          const token = localStorage.getItem('token');
          axios.get('/api/verifications/my', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { if (res.data.success) setMyVerification(res.data.verification); })
            .catch(() => {});
          setMessage(language === 'ar' ? 'تم إرسال طلب التوثيق بنجاح!' : 'Verification request submitted!');
          setTimeout(() => setMessage(''), 3000);
        }}
      />
    )}
    </>
  );
};

export default Profile;
