import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import '../styles/PermissionsManagement.css';

const PermissionsManagement = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // تصفية المستخدمين - فقط regional_admin والأدوار المستقبلية
      const filteredUsers = response.data.users.filter(u =>
        u.role === 'regional_admin' || u.role === 'category_admin'
      );
      setUsers(filteredUsers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تحميل المستخدمين' : 'Failed to load users'));
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId, permissionType, value) => {
    try {
      const token = localStorage.getItem('token');
      const user = users.find(u => u._id === userId);

      if (!user) {
        setError(language === 'ar' ? 'المستخدم غير موجود' : 'User not found');
        return;
      }

      const updatedPermissions = {
        ...(user.permissions || {}),
        [permissionType]: value
      };

      // Update locally first for immediate visual feedback
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u._id === userId
            ? { ...u, permissions: updatedPermissions }
            : u
        )
      );

      await axios.put(
        `/api/permissions/${userId}/permissions`,
        { permissions: updatedPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم تحديث الصلاحيات بنجاح!' : 'Permissions updated successfully!');
      // Fetch fresh data from server
      await fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Permission update error:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تحديث الصلاحيات' : 'Failed to update permissions'));
      // Revert local changes on error
      fetchUsers();
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // فصل المستخدمين حسب النوع
  const regionalAdmins = filteredUsers.filter(u => u.role === 'regional_admin');
  const categoryAdmins = filteredUsers.filter(u => u.role === 'category_admin');

  if (loading) {
    return <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="permissions-management">
      <div className="permissions-header">
        <h2>{language === 'ar' ? 'إدارة الصلاحيات' : 'Permissions Management'}</h2>
        <p className="permissions-subtitle">
          {language === 'ar'
            ? 'تحديد صلاحيات المستخدمين للوصول إلى الأعضاء والمنتجات'
            : 'Configure user permissions for accessing members and products'}
        </p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="permissions-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالاسم أو اسم المستخدم...' : 'Search by name or username...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="regional_admin">{language === 'ar' ? 'مدير منطقة' : 'Regional Admin'}</option>
            <option value="category_admin">{language === 'ar' ? 'مدير قسم' : 'Category Admin'}</option>
          </select>
        </div>
      </div>

      {/* Regional Admins Section */}
      {regionalAdmins.length > 0 && (
        <div className="permissions-section">
          <h3 className="section-title">
            {language === 'ar' ? '👥 مدراء المناطق' : '👥 Regional Admins'}
          </h3>
          <div className="permissions-table-wrapper">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th>{language === 'ar' ? 'الدور' : 'Role'}</th>
                  <th>{language === 'ar' ? 'المنطقة' : 'Region'}</th>
                  <th>{language === 'ar' ? 'عرض الأعضاء' : 'View Members'}</th>
                  <th>{language === 'ar' ? 'التحكم بالأعضاء' : 'Manage Members'}</th>
                  <th>{language === 'ar' ? 'عرض المنتجات' : 'View Products'}</th>
                  <th>{language === 'ar' ? 'التحكم بالمنتجات' : 'Manage Products'}</th>
                </tr>
              </thead>
              <tbody>
                {regionalAdmins.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge regional">
                        {language === 'ar' ? 'مدير منطقة' : 'Regional Admin'}
                      </span>
                    </td>
                    <td>
                      {user.region
                        ? (typeof user.region === 'object'
                            ? (language === 'ar' ? user.region.nameAr : user.region.nameEn)
                            : user.region)
                        : '-'}
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canViewMembers === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canViewMembers', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canManageMembers === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canManageMembers', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canViewProducts === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canViewProducts', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canManageProducts === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canManageProducts', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Admins Section */}
      {categoryAdmins.length > 0 && (
        <div className="permissions-section category-admin-section">
          <h3 className="section-title">
            {language === 'ar' ? '🏷️ مدراء الأقسام' : '🏷️ Category Admins'}
          </h3>
          <div className="permissions-table-wrapper">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th>{language === 'ar' ? 'الدور' : 'Role'}</th>
                  <th>{language === 'ar' ? 'المنطقة/القسم' : 'Region/Category'}</th>
                  <th>{language === 'ar' ? 'عرض المنتجات' : 'View Products'}</th>
                  <th>{language === 'ar' ? 'التحكم بالمنتجات' : 'Manage Products'}</th>
                  <th>{language === 'ar' ? 'عرض الطلبات' : 'View Orders'}</th>
                  <th>{language === 'ar' ? 'التحكم بالطلبات' : 'Manage Orders'}</th>
                </tr>
              </thead>
              <tbody>
                {categoryAdmins.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge category">
                        {language === 'ar' ? 'مدير قسم' : 'Category Admin'}
                      </span>
                    </td>
                    <td>
                      {user.managedCategories?.length > 0
                        ? user.managedCategories.join(', ')
                        : '-'}
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canViewProducts === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canViewProducts', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canManageProducts === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canManageProducts', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canViewOrders === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canViewOrders', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <label className="permission-switch">
                        <input
                          type="checkbox"
                          checked={user.permissions?.canManageOrders === true}
                          onChange={(e) => handlePermissionChange(user._id, 'canManageOrders', e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Users Message */}
      {filteredUsers.length === 0 && (
        <div className="no-users">
          {language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
        </div>
      )}

      {/* Permission Legend */}
      <div className="permissions-legend">
        <h3>{language === 'ar' ? 'شرح الصلاحيات' : 'Permissions Explanation'}</h3>

        {/* Regional Admins Permissions */}
        <div className="legend-section">
          <h4>{language === 'ar' ? 'مدراء المناطق:' : 'Regional Admins:'}</h4>
          <ul>
            <li>
              <strong>{language === 'ar' ? 'عرض الأعضاء:' : 'View Members:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن للمستخدم رؤية قائمة الأعضاء في منطقته فقط'
                : 'User can view the list of members in their region only'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'التحكم بالأعضاء:' : 'Manage Members:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن للمستخدم تعديل وإدارة الأعضاء في منطقته'
                : 'User can edit and manage members in their region'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'عرض المنتجات:' : 'View Products:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن للمستخدم رؤية المنتجات في منطقته فقط'
                : 'User can view products in their region only'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'التحكم بالمنتجات:' : 'Manage Products:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن للمستخدم إضافة وتعديل وحذف المنتجات في منطقته'
                : 'User can add, edit and delete products in their region'}
            </li>
          </ul>
        </div>

        {/* Category Admins Permissions */}
        <div className="legend-section category-legend">
          <h4>{language === 'ar' ? 'مدراء الأقسام:' : 'Category Admins:'}</h4>
          <ul>
            <li>
              <strong>{language === 'ar' ? 'عرض المنتجات:' : 'View Products:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن لمدير القسم رؤية المنتجات في الأقسام المخصصة له فقط'
                : 'Category admin can view products in assigned categories only'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'التحكم بالمنتجات:' : 'Manage Products:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن لمدير القسم إضافة وتعديل المنتجات في الأقسام المخصصة له (الصور، الأوصاف، الأسعار، النقاط)'
                : 'Category admin can add and edit products in assigned categories (images, descriptions, prices, points)'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'عرض الطلبات:' : 'View Orders:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن لمدير القسم رؤية الطلبات التي تحتوي على منتجات من أقسامه فقط'
                : 'Category admin can view orders containing products from their assigned categories only'}
            </li>
            <li>
              <strong>{language === 'ar' ? 'التحكم بالطلبات:' : 'Manage Orders:'}</strong>
              {' '}
              {language === 'ar'
                ? 'يمكن لمدير القسم تحديث حالة الطلبات (قيد الانتظار، جاهز، في الطريق) ولكن لا يمكنه تأكيد الاستلام'
                : 'Category admin can update order status (pending, prepared, on the way) but cannot confirm receipt'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;
