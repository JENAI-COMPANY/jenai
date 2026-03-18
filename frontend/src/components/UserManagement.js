import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import '../styles/UserManagement.css';
import '../styles/Verification.css';
import { countryCodes, allCountries } from '../utils/countryCodes';
import { getRankImage, getRankName } from '../utils/rankHelpers';
import MobileDrawer from './MobileDrawer';

const UserManagement = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [showLocationStats, setShowLocationStats] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showNewConfirmPass, setShowNewConfirmPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    countryCode: '+970',
    country: '',
    city: '',
    role: 'customer',
    sponsorCode: '',
    region: ''
  });
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [sponsorCode, setSponsorCode] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [newUserSponsorName, setNewUserSponsorName] = useState('');
  const [regions, setRegions] = useState([]);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('all');
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkSearchTerm, setNetworkSearchTerm] = useState('');
  const [editCurrentSponsorName, setEditCurrentSponsorName] = useState('');
  const [editNewSponsorName, setEditNewSponsorName] = useState('');
  const [editPassword, setEditPassword] = useState({ newPassword: '', confirmPassword: '', showNew: false, showConfirm: false });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const mobileHandler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', mobileHandler);
    return () => window.removeEventListener('resize', mobileHandler);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRegions();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token);
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Users response:', response.data);
      console.log('First user with region:', response.data.users?.find(u => u.region));
      const hiddenRoles = ['category_admin', 'sales_employee', 'admin_secretary'];
      setUsers((response.data.users || []).filter(u => !hiddenRoles.includes(u.role)));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/regions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegions(response.data.regions || []);
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const fetchSponsorInfo = async (code, isModalSponsor = false) => {
    if (!code || code.trim() === '') {
      if (isModalSponsor) {
        setSponsorName('');
      } else {
        setNewUserSponsorName('');
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/users?subscriberCode=${code.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sponsor = response.data.users?.find(u => u.subscriberCode === code.trim());
      if (sponsor) {
        if (isModalSponsor) {
          setSponsorName(sponsor.name);
        } else {
          setNewUserSponsorName(sponsor.name);
        }
      } else {
        if (isModalSponsor) {
          setSponsorName('');
        } else {
          setNewUserSponsorName('');
        }
      }
    } catch (err) {
      console.error('Error fetching sponsor info:', err);
      if (isModalSponsor) {
        setSponsorName('');
      } else {
        setNewUserSponsorName('');
      }
    }
  };

  const fetchSponsorForEdit = async (code, isCurrent) => {
    const setter = isCurrent ? setEditCurrentSponsorName : setEditNewSponsorName;
    if (!code || code.trim() === '') {
      setter('');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/users?subscriberCode=${code.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sponsor = response.data.users?.find(u => u.subscriberCode === code.trim());
      setter(sponsor ? sponsor.name : '');
    } catch {
      setter('');
    }
  };

  const handleViewNetwork = async (user) => {
    if (user.role !== 'member') {
      setError(language === 'ar' ? 'الشبكة متاحة للأعضاء فقط' : 'Network available for members only');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setNetworkLoading(true);
    setShowNetworkModal(true);
    setSelectedNetwork({ user, levels: null });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/team/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // تنظيم البيانات حسب المستويات (1-5)
      const levels = {
        level1: [],
        level2: [],
        level3: [],
        level4: [],
        level5: []
      };

      response.data.team.forEach(member => {
        if (member.level >= 1 && member.level <= 5) {
          levels[`level${member.level}`].push(member);
        }
      });

      setSelectedNetwork({ user, levels, stats: response.data.stats });
      setNetworkLoading(false);
    } catch (err) {
      console.error('Error fetching network:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تحميل بيانات الشبكة' : 'Failed to load network data'));
      setTimeout(() => setError(''), 3000);
      setNetworkLoading(false);
      setShowNetworkModal(false);
      setSelectedNetwork(null);
    }
  };

  const handleRoleChange = async (userId, newRole, oldRole) => {
    // إذا كان التغيير من customer إلى member، اطلب كود الإحالة
    if (oldRole === 'customer' && newRole === 'member') {
      setPendingRoleChange({ userId, newRole });
      setShowSponsorModal(true);
      setSponsorCode('');
      return;
    }

    // في حالات أخرى، قم بالتحديث مباشرة
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم تحديث الدور بنجاح!' : 'Role updated successfully!');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من حذف المستخدم "${userName}"؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to delete user "${userName}"? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم حذف المستخدم بنجاح!' : 'User deleted successfully!');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل حذف المستخدم' : 'Failed to delete user'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const confirmRoleChangeWithSponsor = async () => {
    if (!sponsorCode || sponsorCode.trim() === '') {
      setError(language === 'ar' ? 'كود الإحالة مطلوب!' : 'Sponsor code is required!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/users/${pendingRoleChange.userId}/role`,
        {
          role: pendingRoleChange.newRole,
          sponsorCode: sponsorCode.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم تحويل العميل إلى عضو بنجاح!' : 'Customer converted to member successfully!');
      setShowSponsorModal(false);
      setPendingRoleChange(null);
      setSponsorCode('');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditUser = (user) => {
    const currentSponsorCode = user.sponsorId?.subscriberCode || '';
    setEditingUser({
      ...user,
      name: user.name,
      username: user.username,
      phone: user.phone,
      countryCode: user.countryCode || '+970',
      country: user.country || '',
      city: user.city || '',
      role: user.role,
      region: user.region?._id || user.region || '',
      supplier: user.supplier?._id || user.supplier || '',
      subscriberCode: user.subscriberCode || '',
      subscriberCodeOriginal: user.subscriberCode || '',
      sponsorCode: currentSponsorCode,
      newSponsorCode: '',
      points: user.points || 0,
      monthlyPoints: user.monthlyPoints || 0,
      bonusPoints: 0,
      compensationPoints: 0,
      isActive: user.isActive !== false
    });
    setEditCurrentSponsorName('');
    setEditNewSponsorName('');
    setEditPassword({ newPassword: '', confirmPassword: '', showNew: false, showConfirm: false });
    if (currentSponsorCode) {
      fetchSponsorForEdit(currentSponsorCode, true);
    }
  };

  const handleSaveEdit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Validate that when converting customer to member, country and city are provided for referral code generation
      const isConvertingToMember = editingUser.role === 'member' &&
                                    users.find(u => u._id === editingUser._id)?.role === 'customer';

      if (isConvertingToMember) {
        if (!editingUser.country || !editingUser.city) {
          setError(language === 'ar' ? 'الدولة والمدينة مطلوبة لإنشاء كود الإحالة عند التحويل لعضو' : 'Country and city are required to create referral code when converting to member');
          setTimeout(() => setError(''), 3000);
          return;
        }
      }

      // City and country are user-entered text fields (used for member code generation)
      // Region is an ObjectId set by super admin (determines regional admin control)
      // These three fields are independent and not linked

      const token = localStorage.getItem('token');

      // Prepare update data
      const updateData = {
        name: editingUser.name,
        username: editingUser.username,
        phone: editingUser.phone,
        countryCode: editingUser.countryCode,
        country: editingUser.country,
        city: editingUser.city,
        role: editingUser.role,
        points: editingUser.points,
        isActive: editingUser.isActive
      };

      // Only include monthlyPoints if not adding bonus/compensation points
      // This prevents conflicts in backend processing
      const hasPointsAdditions = (editingUser.bonusPoints && editingUser.bonusPoints > 0) ||
                                  (editingUser.compensationPoints && editingUser.compensationPoints > 0);

      if (!hasPointsAdditions) {
        updateData.monthlyPoints = editingUser.monthlyPoints;
      }

      // Include bonus/compensation points if they're being added
      if (editingUser.bonusPoints && editingUser.bonusPoints > 0) {
        updateData.bonusPoints = editingUser.bonusPoints;
        updateData.bonusPointsReason = editingUser.bonusPointsReason || '';
      }
      if (editingUser.compensationPoints && editingUser.compensationPoints > 0) {
        updateData.compensationPoints = editingUser.compensationPoints;
      }

      console.log('🔍 Frontend: editingUser.isActive =', editingUser.isActive, 'Type:', typeof editingUser.isActive);
      console.log('🔍 Frontend: updateData.isActive =', updateData.isActive, 'Type:', typeof updateData.isActive);

      // Add region - independent field set by super admin for regional admin control
      if (editingUser.region) {
        // Extract region ID if it's an object, otherwise use as is
        updateData.region = typeof editingUser.region === 'object' ? editingUser.region._id : editingUser.region;
      }

      // Add supplier for products
      if (editingUser.supplier) {
        updateData.supplier = editingUser.supplier;
      }

      // Add subscriberCode if changed
      if (editingUser.subscriberCode && editingUser.subscriberCode !== editingUser.subscriberCodeOriginal) {
        updateData.subscriberCode = editingUser.subscriberCode;
      }

      // Add newSponsorCode if changed
      if (editingUser.newSponsorCode && editingUser.newSponsorCode.trim() !== '') {
        updateData.newSponsorCode = editingUser.newSponsorCode;
      }

      // Handle password change if provided
      if (editPassword.newPassword) {
        if (editPassword.newPassword.length < 6) {
          setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
          setTimeout(() => setError(''), 3000);
          return;
        }
        if (editPassword.newPassword !== editPassword.confirmPassword) {
          setError(language === 'ar' ? 'كلمة المرور وتأكيدها غير متطابقين' : 'Passwords do not match');
          setTimeout(() => setError(''), 3000);
          return;
        }
        updateData.password = editPassword.newPassword;
      }

      console.log('📤 Sending update data:', updateData);

      const response = await axios.put(
        `/api/admin/users/${editingUser._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📥 Response from server:', response.data);
      console.log('📥 Updated user region:', response.data.data?.region);

      // Fetch users first to ensure fresh data
      await fetchUsers();

      // Then close modal and show message
      setEditingUser(null);
      setMessage(language === 'ar' ? 'تم تحديث المستخدم بنجاح!' : 'User updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validate country and city are required for members to create referral code
    if (newUser.role === 'member') {
      if (!newUser.country || !newUser.city) {
        setError(language === 'ar' ? 'الدولة والمدينة مطلوبة لإنشاء كود الإحالة' : 'Country and city are required to create referral code');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const { confirmPassword, ...userData } = newUser;

      await axios.post(
        '/api/admin/users',
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم إضافة المستخدم بنجاح!' : 'User added successfully!');
      setShowAddForm(false);
      setNewUser({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        countryCode: '+970',
        country: '',
        city: '',
        role: 'customer',
        sponsorCode: '',
        region: ''
      });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إضافة المستخدم' : 'Failed to add user'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const exportToPDF = () => {
    const isArabic = language === 'ar';
    const date = new Date().toLocaleDateString('en-US');

    const getRoleLabel = (role) => {
      const roles = {
        super_admin: isArabic ? 'سوبر ادمن' : 'Super Admin',
        regional_admin: isArabic ? 'مدير منطقة' : 'Regional Admin',
        category_admin: isArabic ? 'مدير قسم' : 'Category Admin',
        member: isArabic ? 'عضو' : 'Member',
        customer: isArabic ? 'زبون' : 'Customer',
        supplier: isArabic ? 'مورد' : 'Supplier',
        sales_employee: isArabic ? 'موظف مبيعات' : 'Sales Employee',
        admin_secretary: isArabic ? 'سكرتير' : 'Secretary'
      };
      return roles[role] || role;
    };

    const rows = filteredUsers.map((user, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${user.name || '-'}</td>
        <td>${user.username || '-'}</td>
        <td>${user.phone || '-'}</td>
        <td>${getRoleLabel(user.role)}</td>
        <td>${user.country || '-'}</td>
        <td>${user.city || '-'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString('en-US')}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${isArabic ? 'تقرير المستخدمين' : 'Users Report'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: ${isArabic ? 'rtl' : 'ltr'}; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 12px; }
          .header h1 { color: #667eea; font-size: 20px; margin-bottom: 6px; }
          .header p { font-size: 11px; color: #555; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: ${isArabic ? 'right' : 'left'}; font-size: 10px; }
          th { background-color: #667eea; color: white; }
          tr:nth-child(even) { background-color: #f5f7fa; }
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body { padding: 0; font-size: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${isArabic ? 'تقرير المستخدمين' : 'Users Report'}</h1>
          <p>${isArabic ? 'التاريخ:' : 'Date:'} ${date}</p>
          <p>${isArabic ? 'إجمالي المستخدمين:' : 'Total Users:'} ${filteredUsers.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isArabic ? 'الاسم' : 'Name'}</th>
              <th>${isArabic ? 'اسم المستخدم' : 'Username'}</th>
              <th>${isArabic ? 'رقم الهاتف' : 'Phone'}</th>
              <th>${isArabic ? 'الدور' : 'Role'}</th>
              <th>${isArabic ? 'الدولة' : 'Country'}</th>
              <th>${isArabic ? 'المدينة' : 'City'}</th>
              <th>${isArabic ? 'تاريخ التسجيل' : 'Registered'}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setMessage(isArabic ? 'تم تصدير التقرير بنجاح!' : 'Report exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  // استخراج قائمة الدول الفريدة
  const uniqueCountries = [...new Set(users.map(u => u.country).filter(Boolean))].sort();

  // حساب إحصائيات الموقع
  const getLocationStats = () => {
    const stats = {
      byCountry: {},
      byCity: {},
      byCountryAndRole: {}
    };

    users.forEach(user => {
      const country = user.country || 'غير محدد';
      const city = user.city || 'غير محدد';
      const role = user.role;

      // إحصائيات حسب الدولة
      if (!stats.byCountry[country]) {
        stats.byCountry[country] = { total: 0, members: 0, customers: 0 };
      }
      stats.byCountry[country].total++;
      if (role === 'member') stats.byCountry[country].members++;
      if (role === 'customer') stats.byCountry[country].customers++;

      // إحصائيات حسب المدينة
      const cityKey = `${country} - ${city}`;
      if (!stats.byCity[cityKey]) {
        stats.byCity[cityKey] = { total: 0, members: 0, customers: 0, country, city };
      }
      stats.byCity[cityKey].total++;
      if (role === 'member') stats.byCity[cityKey].members++;
      if (role === 'customer') stats.byCity[cityKey].customers++;
    });

    return stats;
  };

  const locationStats = getLocationStats();

  const filteredUsers = users.filter(user => {
    // إخفاء الموردين من قائمة المستخدمين - يتم إدارتهم من صفحة الموردين فقط
    if (user.role === 'supplier') return false;

    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.subscriberCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesCountry = filterCountry === 'all' || user.country === filterCountry;

    // فلتر المنطقة
    let matchesRegion = true;
    if (selectedRegionFilter === 'unassigned') {
      matchesRegion = !user.region;
    } else if (selectedRegionFilter !== 'all') {
      matchesRegion = user.region && (user.region._id === selectedRegionFilter || user.region === selectedRegionFilter);
    }

    return matchesSearch && matchesRole && matchesCountry && matchesRegion;
  });

  if (loading) {
    return (
      <div className="user-management loading">
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="um-header">
        <div className="um-header-left">
          <h2>{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
          <p className="um-subtitle">
            {language === 'ar'
              ? `إجمالي المستخدمين: ${filteredUsers.length}`
              : `Total Users: ${filteredUsers.length}`}
          </p>
        </div>
        <div className="um-header-right">
          <button className="um-add-btn" onClick={() => setShowAddForm(true)}>
            ➕ {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
          </button>
          <button className="um-export-btn" onClick={exportToPDF}>
            📄 {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>
      </div>

      {message && <div className="um-success">{message}</div>}
      {error && <div className="um-error">{error}</div>}

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search">
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالاسم أو المستخدم أو كود العضوية...' : 'Search by name, username or member code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="um-role-filter">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
            <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
            <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
            <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
          </select>
        </div>

        {/* فلتر المنطقة */}
        <div className="um-location-filter">
          <select value={selectedRegionFilter} onChange={(e) => setSelectedRegionFilter(e.target.value)}>
            <option value="all">🗺️ {language === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>
            <option value="unassigned">⚠️ {language === 'ar' ? 'غير مصنف' : 'Unassigned'}</option>
            {regions.map(region => (
              <option key={region._id} value={region._id}>
                {language === 'ar' ? region.nameAr : region.nameEn} ({users.filter(u => u.region && (u.region._id === region._id || u.region === region._id)).length})
              </option>
            ))}
          </select>
        </div>

        {/* فلتر الدولة - للسوبر أدمن فقط */}
        {currentUser?.role === 'super_admin' && (
          <>
            <div className="um-location-filter">
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="all">🌍 {language === 'ar' ? 'جميع الدول' : 'All Countries'}</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>
                    {country} ({users.filter(u => u.country === country).length})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="um-stats-btn"
              onClick={() => setShowLocationStats(true)}
            >
              📊 {language === 'ar' ? 'إحصائيات المواقع' : 'Location Stats'}
            </button>
          </>
        )}
      </div>

      {/* Users Table */}
      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'كود العضو' : 'Member Code'}</th>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
              <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
              <th>{language === 'ar' ? 'المنطقة' : 'Region'}</th>
              <th>{language === 'ar' ? 'الرتبة' : 'Rank'}</th>
              <th>{language === 'ar' ? 'الدور' : 'Role'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td className="um-code">{user.subscriberCode || '-'}</td>
                <td>
                  {user.name}
                  {user.isVerified && (
                    <span className="user-verified-badge" title={language === 'ar' ? 'حساب موثق' : 'Verified Account'}>✓ {language === 'ar' ? 'موثق' : 'Verified'}</span>
                  )}
                </td>
                <td className="um-username">{user.username}</td>
                <td>{user.phone}</td>
                <td>
                  {user.region ? (
                    <span className="um-region-badge">
                      {typeof user.region === 'object'
                        ? (language === 'ar' ? user.region.nameAr : user.region.nameEn)
                        : user.region}
                    </span>
                  ) : (
                    <span className="um-region-unassigned">
                      {language === 'ar' ? 'غير مصنف' : 'Unassigned'}
                    </span>
                  )}
                </td>
                <td>
                  {user.role === 'member' && user.memberRank ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img
                        src={`/${getRankImage(user.memberRank)}`}
                        alt={getRankName(user.memberRank, language)}
                        style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>
                        {getRankName(user.memberRank, language)}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                  )}
                </td>
                <td>
                  <select
                    className={`um-role-badge ${user.role}`}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value, user.role)}
                  >
                    <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
                    <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
                    <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
                    <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
                  </select>
                </td>
                <td>
                  <span className={`status ${user.isActive !== false ? 'active' : 'inactive'}`}>
                    {user.isActive !== false
                      ? (language === 'ar' ? 'نشط' : 'Active')
                      : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </span>
                </td>
                <td className="um-date">
                  {new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
                <td className="um-actions">
                  <button
                    className="um-edit-btn"
                    onClick={() => handleEditUser(user)}
                  >
                    ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  {/* زر الحذف - يظهر للسوبر أدمن (ما عدا حذف سوبر أدمن آخر) أو لأدمن المنطقة (للمستخدمين في منطقته فقط) */}
                  {user.role !== 'super_admin' && (
                    currentUser?.role === 'super_admin' ||
                    (currentUser?.role === 'regional_admin' &&
                     user.role !== 'regional_admin' &&
                     user.region &&
                     (user.region._id === currentUser.region || user.region === currentUser.region))
                  ) && (
                    <button
                      className="um-delete-btn"
                      onClick={() => handleDeleteUser(user._id, user.name)}
                    >
                      🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal - Mobile Version */}
      <MobileDrawer
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}
        footerButtons={
          <>
            <button className="um-save-btn" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
            </button>
            <button className="um-cancel-btn" onClick={() => setEditingUser(null)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </>
        }
      >
        {editingUser && (
          <div>
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={editingUser.countryCode || '+970'}
                      onChange={(e) => setEditingUser({ ...editingUser, countryCode: e.target.value })}
                      style={{ flex: '0 0 180px' }}
                    >
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code} - {item.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      style={{ flex: '1' }}
                    />
                  </div>
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'نوع المستخدم' : 'Role'}</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    disabled={currentUser?.role !== 'super_admin'}
                  >
                    <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
                    <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
                    <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
                    <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
                  </select>
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                  <select
                    value={editingUser.country || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                  >
                    <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                    {allCountries.map((country) => (
                      <option key={country.value} value={country.value}>
                        {language === 'ar' ? country.label : country.value}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                  </small>
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value.replace(/[^a-zA-Z\s-]/g, '') })}
                    placeholder="Jenin / Ramallah / Gaza"
                  />
                  <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                  </small>
                </div>
              </div>

              {currentUser?.role === 'super_admin' && (editingUser.role === 'regional_admin' || editingUser.role === 'member' || editingUser.role === 'customer') && (
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'المنطقة الإدارية (اختياري)' : 'Administrative Region (Optional)'}</label>
                    <select
                      value={editingUser.region || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, region: e.target.value })}
                    >
                      <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Region'}</option>
                      {regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {language === 'ar' ? region.nameAr : region.nameEn}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تحدد أي مسؤول إقليمي يمكنه التحكم بهذا المستخدم' : 'Determines which regional admin can manage this user'}
                    </small>
                  </div>
                </div>
              )}

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'كود الراعي (من أحاله)' : 'Sponsor Code (Who referred)'}</label>
                  <small style={{ color: '#555', fontSize: '12px', display: 'block', marginBottom: '6px', background: '#f5f5f5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    {language === 'ar' ? '📌 الراعي الحالي: ' : '📌 Current sponsor: '}
                    <strong>{editingUser.sponsorCode || (language === 'ar' ? 'لا يوجد' : 'None')}</strong>
                    {editCurrentSponsorName && (
                      <span style={{ color: '#1a7a3c', marginRight: '6px', marginLeft: '6px' }}>
                        — {editCurrentSponsorName}
                      </span>
                    )}
                  </small>
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_secretary') && (
                    <>
                      <input
                        type="text"
                        value={editingUser.newSponsorCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setEditingUser({ ...editingUser, newSponsorCode: val });
                          fetchSponsorForEdit(val, false);
                        }}
                        placeholder={language === 'ar' ? 'أدخل كود الراعي الجديد' : 'Enter new sponsor code'}
                      />
                      {editingUser.newSponsorCode && (
                        <small style={{ fontSize: '12px', display: 'block', marginTop: '4px', color: editNewSponsorName ? '#1a7a3c' : '#c0392b' }}>
                          {editNewSponsorName
                            ? `✅ ${language === 'ar' ? 'سيتم التغيير إلى:' : 'Will change to:'} ${editNewSponsorName} (${editingUser.newSponsorCode})`
                            : `⚠️ ${language === 'ar' ? 'الكود غير موجود' : 'Code not found'}`}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>

              {currentUser?.role === 'super_admin' && (
                <>
                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'كود الإحالة الخاص' : 'Own Referral Code'}</label>
                      <input
                        type="text"
                        value={editingUser.subscriberCode}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriberCode: e.target.value.toUpperCase() })}
                        placeholder={language === 'ar' ? 'مثال: AB123456' : 'Example: AB123456'}
                      />
                      <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {language === 'ar' ? 'كود الإحالة الخاص بهذا المستخدم' : 'This user\'s own referral code'}
                      </small>
                    </div>
                  </div>

                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'النقاط التراكمية' : 'Cumulative Points'}</label>
                      <input
                        type="number"
                        value={editingUser.points}
                        onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'نقاط الأداء الشخصي' : 'Personal Performance Points'}</label>
                      <input
                        type="number"
                        value={editingUser.monthlyPoints}
                        onChange={(e) => setEditingUser({ ...editingUser, monthlyPoints: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {editingUser.role === 'member' && (
                    <>
                      <div className="um-form-row">
                        <div className="um-form-group">
                          <label style={{ color: '#ff9800' }}>🎁 {language === 'ar' ? 'إضافة نقاط مكافأة' : 'Add Bonus Points'}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder={language === 'ar' ? 'أدخل عدد النقاط المراد إضافتها' : 'Enter points to add'}
                            value={editingUser.bonusPoints || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, bonusPoints: parseInt(e.target.value) || 0 })}
                            style={{ borderColor: '#ff9800' }}
                          />
                          <small style={{ color: '#ff9800', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar'
                              ? '💰 تُضاف للنقاط والرتبة والربح وتُوزع على الأعضاء العلويين (مثل شراء منتج)'
                              : '💰 Added to points, rank & profit, distributes to upline (like purchasing a product)'}
                          </small>
                        </div>
                        <div className="um-form-group">
                          <label style={{ color: '#ff9800' }}>📝 {language === 'ar' ? 'سبب المكافأة' : 'Bonus Reason'}</label>
                          <input
                            type="text"
                            placeholder={language === 'ar' ? 'أدخل سبب إضافة المكافأة' : 'Enter bonus reason'}
                            value={editingUser.bonusPointsReason || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, bonusPointsReason: e.target.value })}
                            style={{ borderColor: '#ff9800' }}
                          />
                          <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar' ? 'يُحفظ في سجل المكافآت' : 'Saved in rewards log'}
                          </small>
                        </div>
                      </div>
                      <div className="um-form-row">
                        <div className="um-form-group">
                          <label style={{ color: '#9c27b0' }}>💵 {language === 'ar' ? 'إضافة نقاط تعويض' : 'Add Compensation Points'}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder={language === 'ar' ? 'أدخل عدد النقاط المراد إضافتها' : 'Enter points to add'}
                            value={editingUser.compensationPoints || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, compensationPoints: parseInt(e.target.value) || 0 })}
                            style={{ borderColor: '#9c27b0' }}
                          />
                          <small style={{ color: '#9c27b0', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar'
                              ? '⚠️ تُضاف للتراكمي فقط لحساب الرتبة، لا تُوزع ولا تُحسب كأرباح'
                              : '⚠️ Added to cumulative points for rank only, no profit or distribution'}
                          </small>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="um-form-row">
                <div className="um-form-group checkbox-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingUser.isActive !== false}
                      onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    />
                    <span>{language === 'ar' ? 'الحساب نشط' : 'Account Active'}</span>
                  </label>
                  <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar'
                      ? '⚠️ عند إيقاف النشاط، لن يتمكن المستخدم من تسجيل الدخول'
                      : '⚠️ When disabled, user will not be able to login'}
                  </small>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #ddd', paddingTop: '16px', marginTop: '4px' }}>
                <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                  {language === 'ar' ? '🔒 تغيير كلمة المرور (اختياري)' : '🔒 Change Password (Optional)'}
                </label>
                <div className="um-form-row">
                  <div className="um-form-group" style={{ position: 'relative' }}>
                    <label>{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <input
                      type={editPassword.showNew ? 'text' : 'password'}
                      value={editPassword.newPassword}
                      onChange={(e) => setEditPassword({ ...editPassword, newPassword: e.target.value })}
                      placeholder={language === 'ar' ? 'اتركه فارغاً للإبقاء على الحالية' : 'Leave empty to keep current'}
                      style={{ paddingRight: '38px' }}
                    />
                    <span
                      onClick={() => setEditPassword({ ...editPassword, showNew: !editPassword.showNew })}
                      style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: 'pointer', fontSize: '16px', userSelect: 'none', color: '#888' }}
                    >
                      {editPassword.showNew ? '🙈' : '👁️'}
                    </span>
                  </div>
                  <div className="um-form-group" style={{ position: 'relative' }}>
                    <label>{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                    <input
                      type={editPassword.showConfirm ? 'text' : 'password'}
                      value={editPassword.confirmPassword}
                      onChange={(e) => setEditPassword({ ...editPassword, confirmPassword: e.target.value })}
                      placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور' : 'Re-enter new password'}
                      style={{ paddingRight: '38px' }}
                    />
                    <span
                      onClick={() => setEditPassword({ ...editPassword, showConfirm: !editPassword.showConfirm })}
                      style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: 'pointer', fontSize: '16px', userSelect: 'none', color: '#888' }}
                    >
                      {editPassword.showConfirm ? '🙈' : '👁️'}
                    </span>
                    {editPassword.newPassword && editPassword.confirmPassword && editPassword.newPassword !== editPassword.confirmPassword && (
                      <small style={{ color: '#e74c3c', fontSize: '11px' }}>
                        {language === 'ar' ? '⚠️ كلمتا المرور غير متطابقتين' : '⚠️ Passwords do not match'}
                      </small>
                    )}
                  </div>
                </div>
              </div>
          </div>
        )}
      </MobileDrawer>

      {/* Edit User Modal - Desktop Version */}
      {!isMobile && editingUser && (
        <div className="um-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="um-modal um-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}</h3>
              <button className="um-modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={editingUser.countryCode || '+970'}
                      onChange={(e) => setEditingUser({ ...editingUser, countryCode: e.target.value })}
                      style={{ flex: '0 0 180px' }}
                    >
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code} - {item.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      style={{ flex: '1' }}
                    />
                  </div>
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'نوع المستخدم' : 'Role'}</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    disabled={currentUser?.role !== 'super_admin'}
                  >
                    <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
                    <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
                    <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
                    <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
                  </select>
                </div>
              </div>

              {/* حقول المدينة والدولة - مستقلة عن المنطقة */}
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                  <select
                    value={editingUser.country || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                  >
                    <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                    {allCountries.map((country) => (
                      <option key={country.value} value={country.value}>
                        {language === 'ar' ? country.label : country.value}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                  </small>
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value.replace(/[^a-zA-Z\s-]/g, '') })}
                    placeholder="Jenin / Ramallah / Gaza"
                  />
                  <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                  </small>
                </div>
              </div>

              {/* حقل المنطقة - يحدده السوبر أدمن فقط للتحكم الإداري */}
              {currentUser?.role === 'super_admin' && (editingUser.role === 'regional_admin' || editingUser.role === 'member' || editingUser.role === 'customer') && (
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'المنطقة الإدارية (اختياري)' : 'Administrative Region (Optional)'}</label>
                    <select
                      value={editingUser.region || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, region: e.target.value })}
                    >
                      <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Region'}</option>
                      {regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {language === 'ar' ? region.nameAr : region.nameEn}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تحدد أي مسؤول إقليمي يمكنه التحكم بهذا المستخدم' : 'Determines which regional admin can manage this user'}
                    </small>
                  </div>
                </div>
              )}

              {/* كود الراعي - عرض للجميع، تعديل للسوبر أدمن وسكرتير الإدارة فقط */}
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'كود الراعي (من أحاله)' : 'Sponsor Code (Who referred)'}</label>
                  <small style={{ color: '#555', fontSize: '12px', display: 'block', marginBottom: '6px', background: '#f5f5f5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    {language === 'ar' ? '📌 الراعي الحالي: ' : '📌 Current sponsor: '}
                    <strong>{editingUser.sponsorCode || (language === 'ar' ? 'لا يوجد' : 'None')}</strong>
                    {editCurrentSponsorName && (
                      <span style={{ color: '#1a7a3c', marginRight: '6px', marginLeft: '6px' }}>
                        — {editCurrentSponsorName}
                      </span>
                    )}
                  </small>
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin_secretary') && (
                    <>
                      <input
                        type="text"
                        value={editingUser.newSponsorCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setEditingUser({ ...editingUser, newSponsorCode: val });
                          fetchSponsorForEdit(val, false);
                        }}
                        placeholder={language === 'ar' ? 'أدخل كود الراعي الجديد' : 'Enter new sponsor code'}
                      />
                      {editingUser.newSponsorCode && (
                        <small style={{ fontSize: '12px', display: 'block', marginTop: '4px', color: editNewSponsorName ? '#1a7a3c' : '#c0392b' }}>
                          {editNewSponsorName
                            ? `✅ ${language === 'ar' ? 'سيتم التغيير إلى:' : 'Will change to:'} ${editNewSponsorName} (${editingUser.newSponsorCode})`
                            : `⚠️ ${language === 'ar' ? 'الكود غير موجود' : 'Code not found'}`}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* حقول السوبر أدمن فقط: كود الإحالة والنقاط */}
              {currentUser?.role === 'super_admin' && (
                <>
                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'كود الإحالة الخاص' : 'Own Referral Code'}</label>
                      <input
                        type="text"
                        value={editingUser.subscriberCode}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriberCode: e.target.value.toUpperCase() })}
                        placeholder={language === 'ar' ? 'مثال: AB123456' : 'Example: AB123456'}
                      />
                      <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {language === 'ar' ? 'كود الإحالة الخاص بهذا المستخدم' : 'This user\'s own referral code'}
                      </small>
                    </div>
                  </div>

                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'النقاط التراكمية' : 'Cumulative Points'}</label>
                      <input
                        type="number"
                        value={editingUser.points}
                        onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'نقاط الأداء الشخصي' : 'Personal Performance Points'}</label>
                      <input
                        type="number"
                        value={editingUser.monthlyPoints}
                        onChange={(e) => setEditingUser({ ...editingUser, monthlyPoints: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {editingUser.role === 'member' && (
                    <>
                      <div className="um-form-row">
                        <div className="um-form-group">
                          <label style={{ color: '#ff9800' }}>🎁 {language === 'ar' ? 'إضافة نقاط مكافأة' : 'Add Bonus Points'}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder={language === 'ar' ? 'أدخل عدد النقاط المراد إضافتها' : 'Enter points to add'}
                            value={editingUser.bonusPoints || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, bonusPoints: parseInt(e.target.value) || 0 })}
                            style={{ borderColor: '#ff9800' }}
                          />
                          <small style={{ color: '#ff9800', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar'
                              ? '💰 تُضاف للنقاط والرتبة والربح وتُوزع على الأعضاء العلويين (مثل شراء منتج)'
                              : '💰 Added to points, rank & profit, distributes to upline (like purchasing a product)'}
                          </small>
                        </div>
                        <div className="um-form-group">
                          <label style={{ color: '#ff9800' }}>📝 {language === 'ar' ? 'سبب المكافأة' : 'Bonus Reason'}</label>
                          <input
                            type="text"
                            placeholder={language === 'ar' ? 'أدخل سبب إضافة المكافأة' : 'Enter bonus reason'}
                            value={editingUser.bonusPointsReason || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, bonusPointsReason: e.target.value })}
                            style={{ borderColor: '#ff9800' }}
                          />
                          <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar' ? 'يُحفظ في سجل المكافآت' : 'Saved in rewards log'}
                          </small>
                        </div>
                      </div>
                      <div className="um-form-row">
                        <div className="um-form-group">
                          <label style={{ color: '#9c27b0' }}>💵 {language === 'ar' ? 'إضافة نقاط تعويض' : 'Add Compensation Points'}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder={language === 'ar' ? 'أدخل عدد النقاط المراد إضافتها' : 'Enter points to add'}
                            value={editingUser.compensationPoints || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, compensationPoints: parseInt(e.target.value) || 0 })}
                            style={{ borderColor: '#9c27b0' }}
                          />
                          <small style={{ color: '#9c27b0', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {language === 'ar'
                              ? '⚠️ تُضاف للتراكمي فقط لحساب الرتبة، لا تُوزع ولا تُحسب كأرباح'
                              : '⚠️ Added to cumulative points for rank only, no profit or distribution'}
                          </small>
                        </div>
                      </div>
                    </>
                  )}

                </>
              )}

              {/* حقل تفعيل/إيقاف الحساب */}
              <div className="um-form-row">
                <div className="um-form-group checkbox-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingUser.isActive !== false}
                      onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    />
                    <span>{language === 'ar' ? 'الحساب نشط' : 'Account Active'}</span>
                  </label>
                  <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {language === 'ar'
                      ? '⚠️ عند إيقاف النشاط، لن يتمكن المستخدم من تسجيل الدخول'
                      : '⚠️ When disabled, user will not be able to login'}
                  </small>
                </div>
              </div>

            {/* قسم تغيير كلمة المرور */}
            <div style={{ borderTop: '1px dashed #ddd', paddingTop: '16px', marginTop: '4px' }}>
              <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                {language === 'ar' ? '🔒 تغيير كلمة المرور (اختياري)' : '🔒 Change Password (Optional)'}
              </label>
              <div className="um-form-row">
                <div className="um-form-group" style={{ position: 'relative' }}>
                  <label>{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                  <input
                    type={editPassword.showNew ? 'text' : 'password'}
                    value={editPassword.newPassword}
                    onChange={(e) => setEditPassword({ ...editPassword, newPassword: e.target.value })}
                    placeholder={language === 'ar' ? 'اتركه فارغاً للإبقاء على الحالية' : 'Leave empty to keep current'}
                    style={{ paddingRight: '38px' }}
                  />
                  <span
                    onClick={() => setEditPassword({ ...editPassword, showNew: !editPassword.showNew })}
                    style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: 'pointer', fontSize: '16px', userSelect: 'none', color: '#888' }}
                  >
                    {editPassword.showNew ? '🙈' : '👁️'}
                  </span>
                </div>
                <div className="um-form-group" style={{ position: 'relative' }}>
                  <label>{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <input
                    type={editPassword.showConfirm ? 'text' : 'password'}
                    value={editPassword.confirmPassword}
                    onChange={(e) => setEditPassword({ ...editPassword, confirmPassword: e.target.value })}
                    placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور' : 'Re-enter new password'}
                    style={{ paddingRight: '38px' }}
                  />
                  <span
                    onClick={() => setEditPassword({ ...editPassword, showConfirm: !editPassword.showConfirm })}
                    style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: 'pointer', fontSize: '16px', userSelect: 'none', color: '#888' }}
                  >
                    {editPassword.showConfirm ? '🙈' : '👁️'}
                  </span>
                  {editPassword.newPassword && editPassword.confirmPassword && editPassword.newPassword !== editPassword.confirmPassword && (
                    <small style={{ color: '#e74c3c', fontSize: '11px' }}>
                      {language === 'ar' ? '⚠️ كلمتا المرور غير متطابقتين' : '⚠️ Passwords do not match'}
                    </small>
                  )}
                </div>
              </div>
            </div>
            </div>{/* end um-modal-body */}

            <div className="um-modal-footer">
              <button className="um-save-btn" onClick={handleSaveEdit}>
                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
              <button className="um-cancel-btn" onClick={() => setEditingUser(null)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal - Mobile Version */}
      <MobileDrawer
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title={language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
        footerButtons={
          <>
            <button className="um-save-btn" onClick={(e) => { e.preventDefault(); handleCreateUser(e); }} type="button">
              {language === 'ar' ? 'إضافة المستخدم' : 'Add User'}
            </button>
            <button className="um-cancel-btn" type="button" onClick={() => setShowAddForm(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} autoComplete="off" id="add-user-form-mobile">
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'اسم المستخدم (إنجليزي فقط) *' : 'Username (English only) *'}</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => {
                        const englishOnly = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                        setNewUser({ ...newUser, username: englishOnly });
                      }}
                      required
                    />
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group password-group">
                    <label>{language === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      minLength="6"
                      required
                      className="password-input"
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowNewPass(v => !v)}>
                      {showNewPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="um-form-group password-group">
                    <label>{language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                    <input
                      type={showNewConfirmPass ? 'text' : 'password'}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      minLength="6"
                      required
                      className="password-input"
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowNewConfirmPass(v => !v)}>
                      {showNewConfirmPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={newUser.countryCode || '+970'}
                        onChange={(e) => setNewUser({ ...newUser, countryCode: e.target.value })}
                        style={{ flex: '0 0 180px' }}
                      >
                        {countryCodes.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} - {item.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        style={{ flex: '1' }}
                      />
                    </div>
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'نوع المستخدم *' : 'User Role *'}</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      required
                    >
                      <option value="customer">{language === 'ar' ? 'زبون' : 'Customer'}</option>
                      <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="regional_admin">{language === 'ar' ? 'ادمن منطقة' : 'Regional Admin'}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                    <select
                      value={newUser.country || ''}
                      onChange={(e) => setNewUser({ ...newUser, country: e.target.value })}
                    >
                      <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                      {allCountries.map((country) => (
                        <option key={country.value} value={country.value}>
                          {language === 'ar' ? country.label : country.value}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                    </small>
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}</label>
                    <input
                      type="text"
                      value={newUser.city || ''}
                      onChange={(e) => setNewUser({ ...newUser, city: e.target.value.replace(/[^a-zA-Z\s-]/g, '') })}
                      placeholder="Jenin / Ramallah / Gaza"
                    />
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                    </small>
                  </div>
                </div>

                {currentUser?.role === 'super_admin' && (newUser.role === 'regional_admin' || newUser.role === 'member' || newUser.role === 'customer') && (
                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'المنطقة الإدارية (اختياري)' : 'Administrative Region (Optional)'}</label>
                      <select
                        value={newUser.region || ''}
                        onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                      >
                        <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Region'}</option>
                        {regions.map((region) => (
                          <option key={region._id} value={region._id}>
                            {language === 'ar' ? region.nameAr : region.nameEn}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        {language === 'ar' ? 'تحدد أي مسؤول إقليمي يمكنه التحكم بهذا المستخدم' : 'Determines which regional admin can manage this user'}
                      </small>
                    </div>
                  </div>
                )}

                {newUser.role === 'member' && (
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'كود الراعي (اختياري)' : 'Sponsor Code (Optional)'}</label>
                    <input
                      type="text"
                      value={newUser.sponsorCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setNewUser({ ...newUser, sponsorCode: code });
                        fetchSponsorInfo(code, false);
                      }}
                      placeholder={language === 'ar' ? 'أدخل كود الراعي لربط العضو بشجرة العمولات' : 'Enter sponsor code to link member to commission tree'}
                    />
                    {newUserSponsorName && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', color: '#2e7d32' }}>
                        ✓ {language === 'ar' ? 'الراعي:' : 'Sponsor:'} <strong>{newUserSponsorName}</strong>
                      </div>
                    )}
                    {newUser.sponsorCode && !newUserSponsorName && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px', color: '#f57c00' }}>
                        ⚠️ {language === 'ar' ? 'كود غير موجود' : 'Code not found'}
                      </div>
                    )}
                  </div>
                )}
        </form>
      </MobileDrawer>

      {/* Add User Modal - Desktop Version */}
      {!isMobile && showAddForm && (
        <div className="um-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="um-modal um-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
              <button className="um-modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser} autoComplete="off">
              <div className="um-modal-body">
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'اسم المستخدم (إنجليزي فقط) *' : 'Username (English only) *'}</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => {
                        // Only allow English letters, numbers, underscore, and hyphen
                        const englishOnly = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                        setNewUser({ ...newUser, username: englishOnly });
                      }}
                      required
                    />
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group password-group">
                    <label>{language === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      minLength="6"
                      required
                      className="password-input"
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowNewPass(v => !v)}>
                      {showNewPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="um-form-group password-group">
                    <label>{language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                    <input
                      type={showNewConfirmPass ? 'text' : 'password'}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      minLength="6"
                      required
                      className="password-input"
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowNewConfirmPass(v => !v)}>
                      {showNewConfirmPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={newUser.countryCode || '+970'}
                        onChange={(e) => setNewUser({ ...newUser, countryCode: e.target.value })}
                        style={{ flex: '0 0 180px' }}
                      >
                        {countryCodes.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} - {item.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        style={{ flex: '1' }}
                      />
                    </div>
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'نوع المستخدم *' : 'User Role *'}</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      required
                    >
                      <option value="customer">{language === 'ar' ? 'زبون' : 'Customer'}</option>
                      <option value="member">{language === 'ar' ? 'عضو' : 'Member'}</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="regional_admin">{language === 'ar' ? 'ادمن منطقة' : 'Regional Admin'}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* حقول المدينة والدولة - مستقلة عن المنطقة */}
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                    <select
                      value={newUser.country || ''}
                      onChange={(e) => setNewUser({ ...newUser, country: e.target.value })}
                    >
                      <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                      {allCountries.map((country) => (
                        <option key={country.value} value={country.value}>
                          {language === 'ar' ? country.label : country.value}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                    </small>
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}</label>
                    <input
                      type="text"
                      value={newUser.city || ''}
                      onChange={(e) => setNewUser({ ...newUser, city: e.target.value.replace(/[^a-zA-Z\s-]/g, '') })}
                      placeholder="Jenin / Ramallah / Gaza"
                    />
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'تُستخدم لتوليد كود العضو' : 'Used for member code generation'}
                    </small>
                  </div>
                </div>

                {/* حقل المنطقة - يحدده السوبر أدمن فقط للتحكم الإداري */}
                {currentUser?.role === 'super_admin' && (newUser.role === 'regional_admin' || newUser.role === 'member' || newUser.role === 'customer') && (
                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'المنطقة الإدارية (اختياري)' : 'Administrative Region (Optional)'}</label>
                      <select
                        value={newUser.region || ''}
                        onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                      >
                        <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Region'}</option>
                        {regions.map((region) => (
                          <option key={region._id} value={region._id}>
                            {language === 'ar' ? region.nameAr : region.nameEn}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        {language === 'ar' ? 'تحدد أي مسؤول إقليمي يمكنه التحكم بهذا المستخدم' : 'Determines which regional admin can manage this user'}
                      </small>
                    </div>
                  </div>
                )}

                {newUser.role === 'member' && (
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'كود الراعي (اختياري)' : 'Sponsor Code (Optional)'}</label>
                    <input
                      type="text"
                      value={newUser.sponsorCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setNewUser({ ...newUser, sponsorCode: code });
                        fetchSponsorInfo(code, false);
                      }}
                      placeholder={language === 'ar' ? 'أدخل كود الراعي لربط العضو بشجرة العمولات' : 'Enter sponsor code to link member to commission tree'}
                    />
                    {newUserSponsorName && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', color: '#2e7d32' }}>
                        ✓ {language === 'ar' ? 'الراعي:' : 'Sponsor:'} <strong>{newUserSponsorName}</strong>
                      </div>
                    )}
                    {newUser.sponsorCode && !newUserSponsorName && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px', color: '#f57c00' }}>
                        ⚠️ {language === 'ar' ? 'كود غير موجود' : 'Code not found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="um-modal-footer">
                <button type="submit" className="um-save-btn">
                  {language === 'ar' ? 'إضافة المستخدم' : 'Add User'}
                </button>
                <button type="button" className="um-cancel-btn" onClick={() => setShowAddForm(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Statistics Modal - Mobile Version */}
      <MobileDrawer
        isOpen={showLocationStats}
        onClose={() => setShowLocationStats(false)}
        title={`📊 ${language === 'ar' ? 'إحصائيات الأعضاء حسب الموقع' : 'Members Statistics by Location'}`}
      >
        <div>
          <div className="um-stats-section">
            <h4>🌍 {language === 'ar' ? 'حسب الدولة' : 'By Country'}</h4>
            <div className="um-stats-table-wrapper">
              <table className="um-stats-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
                    <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    <th>{language === 'ar' ? 'أعضاء' : 'Members'}</th>
                    <th>{language === 'ar' ? 'عملاء' : 'Customers'}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(locationStats.byCountry)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([country, stats]) => (
                      <tr
                        key={country}
                        className="um-stats-row-clickable"
                        onClick={() => {
                          setFilterCountry(country === 'غير محدد' ? 'all' : country);
                          setShowLocationStats(false);
                        }}
                      >
                        <td className="um-country-name">{country}</td>
                        <td className="um-stat-total">{stats.total}</td>
                        <td className="um-stat-members">👥 {stats.members}</td>
                        <td className="um-stat-customers">🛒 {stats.customers}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="um-stats-section">
            <h4>🏙️ {language === 'ar' ? 'حسب المحافظة/المدينة' : 'By City/Province'}</h4>
            <div className="um-stats-table-wrapper">
              <table className="um-stats-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
                    <th>{language === 'ar' ? 'المحافظة/المدينة' : 'City/Province'}</th>
                    <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    <th>{language === 'ar' ? 'أعضاء' : 'Members'}</th>
                    <th>{language === 'ar' ? 'عملاء' : 'Customers'}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(locationStats.byCity)
                    .sort((a, b) => b[1].total - a[1].total)
                    .slice(0, 20)
                    .map(([key, stats]) => (
                      <tr
                        key={key}
                        className="um-stats-row-clickable"
                        onClick={() => {
                          if (stats.country !== 'غير محدد') setFilterCountry(stats.country);
                          setShowLocationStats(false);
                        }}
                      >
                        <td>{stats.country}</td>
                        <td className="um-city-name">{stats.city}</td>
                        <td className="um-stat-total">{stats.total}</td>
                        <td className="um-stat-members">👥 {stats.members}</td>
                        <td className="um-stat-customers">🛒 {stats.customers}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="um-stats-summary">
            <div className="um-summary-card">
              <span className="um-summary-icon">🌍</span>
              <span className="um-summary-value">{Object.keys(locationStats.byCountry).length}</span>
              <span className="um-summary-label">{language === 'ar' ? 'دول' : 'Countries'}</span>
            </div>
            <div className="um-summary-card">
              <span className="um-summary-icon">🏙️</span>
              <span className="um-summary-value">{Object.keys(locationStats.byCity).length}</span>
              <span className="um-summary-label">{language === 'ar' ? 'محافظات/مدن' : 'Cities'}</span>
            </div>
            <div className="um-summary-card">
              <span className="um-summary-icon">👥</span>
              <span className="um-summary-value">{users.filter(u => u.role === 'member').length}</span>
              <span className="um-summary-label">{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</span>
            </div>
            <div className="um-summary-card">
              <span className="um-summary-icon">🛒</span>
              <span className="um-summary-value">{users.filter(u => u.role === 'customer').length}</span>
              <span className="um-summary-label">{language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}</span>
            </div>
          </div>
        </div>
      </MobileDrawer>

      {/* Location Statistics Modal - Desktop Version */}
      {!isMobile && showLocationStats && (
        <div className="um-modal-overlay" onClick={() => setShowLocationStats(false)}>
          <div className="um-modal um-modal-stats" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header um-stats-header">
              <h3>📊 {language === 'ar' ? 'إحصائيات الأعضاء حسب الموقع' : 'Members Statistics by Location'}</h3>
              <button className="um-modal-close" onClick={() => setShowLocationStats(false)}>✕</button>
            </div>
            <div className="um-modal-body">
              {/* إحصائيات حسب الدولة */}
              <div className="um-stats-section">
                <h4>🌍 {language === 'ar' ? 'حسب الدولة' : 'By Country'}</h4>
                <div className="um-stats-table-wrapper">
                  <table className="um-stats-table">
                    <thead>
                      <tr>
                        <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
                        <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        <th>{language === 'ar' ? 'أعضاء' : 'Members'}</th>
                        <th>{language === 'ar' ? 'عملاء' : 'Customers'}</th>
                        <th>{language === 'ar' ? 'النسبة' : 'Percentage'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(locationStats.byCountry)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([country, stats]) => (
                          <tr
                            key={country}
                            className="um-stats-row-clickable"
                            onClick={() => {
                              setFilterCountry(country === 'غير محدد' ? 'all' : country);
                              setShowLocationStats(false);
                            }}
                          >
                            <td className="um-country-name">
                              <span className="um-flag">🏳️</span>
                              {country}
                            </td>
                            <td className="um-stat-total">{stats.total}</td>
                            <td className="um-stat-members">👥 {stats.members}</td>
                            <td className="um-stat-customers">🛒 {stats.customers}</td>
                            <td className="um-stat-percentage">
                              <div className="um-progress-bar">
                                <div
                                  className="um-progress-fill"
                                  style={{ width: `${(stats.total / users.length * 100)}%` }}
                                ></div>
                                <span>{((stats.total / users.length) * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* إحصائيات حسب المدينة */}
              <div className="um-stats-section">
                <h4>🏙️ {language === 'ar' ? 'حسب المحافظة/المدينة' : 'By City/Province'}</h4>
                <div className="um-stats-table-wrapper">
                  <table className="um-stats-table">
                    <thead>
                      <tr>
                        <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
                        <th>{language === 'ar' ? 'المحافظة/المدينة' : 'City/Province'}</th>
                        <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        <th>{language === 'ar' ? 'أعضاء' : 'Members'}</th>
                        <th>{language === 'ar' ? 'عملاء' : 'Customers'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(locationStats.byCity)
                        .sort((a, b) => b[1].total - a[1].total)
                        .slice(0, 20) // أعلى 20 مدينة
                        .map(([key, stats]) => (
                          <tr
                            key={key}
                            className="um-stats-row-clickable"
                            onClick={() => {
                              if (stats.country !== 'غير محدد') {
                                setFilterCountry(stats.country);
                              }
                              setShowLocationStats(false);
                            }}
                          >
                            <td>{stats.country}</td>
                            <td className="um-city-name">{stats.city}</td>
                            <td className="um-stat-total">{stats.total}</td>
                            <td className="um-stat-members">👥 {stats.members}</td>
                            <td className="um-stat-customers">🛒 {stats.customers}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ملخص عام */}
              <div className="um-stats-summary">
                <div className="um-summary-card">
                  <span className="um-summary-icon">🌍</span>
                  <span className="um-summary-value">{Object.keys(locationStats.byCountry).length}</span>
                  <span className="um-summary-label">{language === 'ar' ? 'دول' : 'Countries'}</span>
                </div>
                <div className="um-summary-card">
                  <span className="um-summary-icon">🏙️</span>
                  <span className="um-summary-value">{Object.keys(locationStats.byCity).length}</span>
                  <span className="um-summary-label">{language === 'ar' ? 'محافظات/مدن' : 'Cities'}</span>
                </div>
                <div className="um-summary-card">
                  <span className="um-summary-icon">👥</span>
                  <span className="um-summary-value">{users.filter(u => u.role === 'member').length}</span>
                  <span className="um-summary-label">{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</span>
                </div>
                <div className="um-summary-card">
                  <span className="um-summary-icon">🛒</span>
                  <span className="um-summary-value">{users.filter(u => u.role === 'customer').length}</span>
                  <span className="um-summary-label">{language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Modal - Mobile Version */}
      <MobileDrawer
        isOpen={showNetworkModal && !!selectedNetwork}
        onClose={() => { setShowNetworkModal(false); setSelectedNetwork(null); setNetworkSearchTerm(''); }}
        title={selectedNetwork ? `🌐 ${language === 'ar' ? 'شبكة العضو:' : 'Member Network:'} ${selectedNetwork.user.name}` : ''}
      >
        {selectedNetwork && (
          <div>
            {networkLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
              </div>
            ) : selectedNetwork.levels && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'بحث بالاسم، اليوزر أو الكود...' : 'Search by name, username or code...'}
                    value={networkSearchTerm}
                    onChange={(e) => setNetworkSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e1e8ed', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div className="um-network-summary">
                  <div className="um-summary-item">
                    <label>{language === 'ar' ? 'كود العضو:' : 'Member Code:'}</label>
                    <span className="um-code-badge">{selectedNetwork.user.subscriberCode}</span>
                  </div>
                  <div className="um-summary-item">
                    <label>{language === 'ar' ? 'إجمالي الشبكة:' : 'Total Network:'}</label>
                    <span className="um-stat-value">{selectedNetwork.stats?.totalMembers || 0}</span>
                  </div>
                  <div className="um-summary-item">
                    <label>{language === 'ar' ? 'النقاط:' : 'Points:'}</label>
                    <span className="um-stat-value">{selectedNetwork.stats?.totalPoints || 0}</span>
                  </div>
                </div>
                <div className="um-network-levels">
                  {[1, 2, 3, 4, 5].map(level => {
                    const levelKey = `level${level}`;
                    const levelMembers = selectedNetwork.levels[levelKey] || [];
                    const filteredLevelMembers = levelMembers.filter(member =>
                      member.name.toLowerCase().includes(networkSearchTerm.toLowerCase()) ||
                      member.username.toLowerCase().includes(networkSearchTerm.toLowerCase()) ||
                      (member.subscriberCode || '').toLowerCase().includes(networkSearchTerm.toLowerCase())
                    );
                    return (
                      <div key={level} className="um-network-level">
                        <div className="um-level-header">
                          <h4>{language === 'ar' ? `المستوى ${level}` : `Level ${level}`}</h4>
                          <span className="um-level-count">{filteredLevelMembers.length} {language === 'ar' ? 'عضو' : 'member'}</span>
                        </div>
                        {filteredLevelMembers.length > 0 ? (
                          <div className="um-level-members">
                            {filteredLevelMembers.map(member => (
                              <div key={member._id} className="um-member-card">
                                <div className="um-member-info">
                                  <strong>{member.name}</strong>
                                  <small>@{member.username}</small>
                                </div>
                                <div className="um-member-details">
                                  <span className="um-member-code">{member.subscriberCode}</span>
                                  <span className="um-member-points">{member.monthlyPoints || 0} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                                </div>
                                {member.memberRank && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 8px', background: '#f8f9fa', borderRadius: '6px' }}>
                                    <img src={`/${getRankImage(member.memberRank)}`} alt={getRankName(member.memberRank, language)} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#555' }}>{getRankName(member.memberRank, language)}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="um-no-members">{language === 'ar' ? 'لا يوجد أعضاء في هذا المستوى' : 'No members in this level'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </MobileDrawer>

      {/* Network Modal - Desktop Version */}
      {!isMobile && showNetworkModal && selectedNetwork && (
        <div className="um-modal-overlay" onClick={() => {
          setShowNetworkModal(false);
          setSelectedNetwork(null);
          setNetworkSearchTerm('');
        }}>
          <div className="um-modal um-modal-network" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>🌐 {language === 'ar' ? 'شبكة العضو:' : 'Member Network:'} {selectedNetwork.user.name}</h3>
              <button className="um-modal-close" onClick={() => {
                setShowNetworkModal(false);
                setSelectedNetwork(null);
                setNetworkSearchTerm('');
              }}>✕</button>
            </div>
            <div className="um-modal-body">
              {networkLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="mr-spinner" style={{ margin: '0 auto 16px' }}></div>
                  <p>{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
                </div>
              ) : selectedNetwork.levels && (
                <>
                  {/* Search Input */}
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'بحث بالاسم، اليوزر أو الكود...' : 'Search by name, username or code...'}
                      value={networkSearchTerm}
                      onChange={(e) => setNetworkSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Member Summary */}
                  <div className="um-network-summary">
                    <div className="um-summary-item">
                      <label>{language === 'ar' ? 'كود العضو:' : 'Member Code:'}</label>
                      <span className="um-code-badge">{selectedNetwork.user.subscriberCode}</span>
                    </div>
                    <div className="um-summary-item">
                      <label>{language === 'ar' ? 'إجمالي الشبكة:' : 'Total Network:'}</label>
                      <span className="um-stat-value">{selectedNetwork.stats?.totalMembers || 0}</span>
                    </div>
                    <div className="um-summary-item">
                      <label>{language === 'ar' ? 'النقاط:' : 'Points:'}</label>
                      <span className="um-stat-value">{selectedNetwork.stats?.totalPoints || 0}</span>
                    </div>
                  </div>

                  {/* Network Levels */}
                  <div className="um-network-levels">
                    {[1, 2, 3, 4, 5].map(level => {
                      const levelKey = `level${level}`;
                      const levelMembers = selectedNetwork.levels[levelKey] || [];

                      // Filter members by search term
                      const filteredLevelMembers = levelMembers.filter(member =>
                        member.name.toLowerCase().includes(networkSearchTerm.toLowerCase()) ||
                        member.username.toLowerCase().includes(networkSearchTerm.toLowerCase()) ||
                        (member.subscriberCode || '').toLowerCase().includes(networkSearchTerm.toLowerCase())
                      );

                      const levelCount = filteredLevelMembers.length;

                      return (
                        <div key={level} className="um-network-level">
                          <div className="um-level-header">
                            <h4>
                              {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                            </h4>
                            <span className="um-level-count">
                              {levelCount} {language === 'ar' ? 'عضو' : 'member'}
                            </span>
                          </div>
                          {filteredLevelMembers.length > 0 ? (
                            <div className="um-level-members">
                              {filteredLevelMembers.map(member => (
                                <div key={member._id} className="um-member-card">
                                  <div className="um-member-info">
                                    <strong>{member.name}</strong>
                                    <small>@{member.username}</small>
                                  </div>
                                  <div className="um-member-details">
                                    <span className="um-member-code">{member.subscriberCode}</span>
                                    <span className="um-member-points">{member.monthlyPoints || 0} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                                  </div>
                                  {member.memberRank && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 8px', background: '#f8f9fa', borderRadius: '6px' }}>
                                      <img
                                        src={`/${getRankImage(member.memberRank)}`}
                                        alt={getRankName(member.memberRank, language)}
                                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                      />
                                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#555' }}>
                                        {getRankName(member.memberRank, language)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="um-no-members">{language === 'ar' ? 'لا يوجد أعضاء في هذا المستوى' : 'No members in this level'}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Code Modal - Mobile Version */}
      <MobileDrawer
        isOpen={showSponsorModal}
        onClose={() => { setShowSponsorModal(false); setPendingRoleChange(null); setSponsorCode(''); }}
        title={`🎯 ${language === 'ar' ? 'كود الإحالة مطلوب' : 'Sponsor Code Required'}`}
        footerButtons={
          <>
            <button className="um-save-btn" onClick={confirmRoleChangeWithSponsor}>
              ✅ {language === 'ar' ? 'تأكيد التحويل' : 'Confirm Conversion'}
            </button>
            <button className="um-cancel-btn" onClick={() => { setShowSponsorModal(false); setPendingRoleChange(null); setSponsorCode(''); }}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </>
        }
      >
        <div>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            {language === 'ar'
              ? 'عند تحويل عميل إلى عضو، يجب إدخال كود الإحالة (الراعي) لربط العضو بشجرة العمولات.'
              : 'When converting a customer to a member, you must enter a sponsor code to link the member to the commission tree.'}
          </p>
          <div className="um-form-group">
            <label>{language === 'ar' ? 'كود الإحالة (إجباري) *' : 'Sponsor Code (Required) *'}</label>
            <input
              type="text"
              value={sponsorCode}
              onChange={(e) => {
                const code = e.target.value.toUpperCase();
                setSponsorCode(code);
                fetchSponsorInfo(code, true);
              }}
              placeholder={language === 'ar' ? 'أدخل كود الراعي...' : 'Enter sponsor code...'}
              onKeyPress={(e) => { if (e.key === 'Enter') confirmRoleChangeWithSponsor(); }}
            />
            {sponsorName && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', color: '#2e7d32' }}>
                ✓ {language === 'ar' ? 'الراعي:' : 'Sponsor:'} <strong>{sponsorName}</strong>
              </div>
            )}
            {sponsorCode && !sponsorName && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px', color: '#f57c00' }}>
                ⚠️ {language === 'ar' ? 'كود غير موجود' : 'Code not found'}
              </div>
            )}
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              {language === 'ar' ? 'مثال: AB123456' : 'Example: AB123456'}
            </small>
          </div>
        </div>
      </MobileDrawer>

      {/* Sponsor Code Modal - Desktop Version */}
      {!isMobile && showSponsorModal && (
        <div className="um-modal-overlay" onClick={() => {
          setShowSponsorModal(false);
          setPendingRoleChange(null);
          setSponsorCode('');
        }}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>🎯 {language === 'ar' ? 'كود الإحالة مطلوب' : 'Sponsor Code Required'}</h3>
              <button className="um-modal-close" onClick={() => {
                setShowSponsorModal(false);
                setPendingRoleChange(null);
                setSponsorCode('');
              }}>✕</button>
            </div>
            <div className="um-modal-body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                {language === 'ar'
                  ? 'عند تحويل عميل إلى عضو، يجب إدخال كود الإحالة (الراعي) لربط العضو بشجرة العمولات.'
                  : 'When converting a customer to a member, you must enter a sponsor code to link the member to the commission tree.'}
              </p>
              <div className="um-form-group">
                <label>{language === 'ar' ? 'كود الإحالة (إجباري) *' : 'Sponsor Code (Required) *'}</label>
                <input
                  type="text"
                  value={sponsorCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setSponsorCode(code);
                    fetchSponsorInfo(code, true);
                  }}
                  placeholder={language === 'ar' ? 'أدخل كود الراعي...' : 'Enter sponsor code...'}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      confirmRoleChangeWithSponsor();
                    }
                  }}
                />
                {sponsorName && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', color: '#2e7d32' }}>
                    ✓ {language === 'ar' ? 'الراعي:' : 'Sponsor:'} <strong>{sponsorName}</strong>
                  </div>
                )}
                {sponsorCode && !sponsorName && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px', color: '#f57c00' }}>
                    ⚠️ {language === 'ar' ? 'كود غير موجود' : 'Code not found'}
                  </div>
                )}
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {language === 'ar'
                    ? 'مثال: AB123456'
                    : 'Example: AB123456'}
                </small>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="um-save-btn" onClick={confirmRoleChangeWithSponsor}>
                ✅ {language === 'ar' ? 'تأكيد التحويل' : 'Confirm Conversion'}
              </button>
              <button className="um-cancel-btn" onClick={() => {
                setShowSponsorModal(false);
                setPendingRoleChange(null);
                setSponsorCode('');
              }}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
