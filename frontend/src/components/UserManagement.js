import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    country: '',
    city: '',
    role: 'customer',
    sponsorCode: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token);
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Users response:', response.data);
      setUsers(response.data.users || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
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

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      name: user.name,
      username: user.username,
      phone: user.phone,
      country: user.country || '',
      city: user.city || '',
      role: user.role,
      subscriberCode: user.subscriberCode || '',
      subscriberCodeOriginal: user.subscriberCode || '',
      sponsorCode: user.sponsorId?.subscriberCode || '',
      newSponsorCode: '',
      points: user.points || 0,
      monthlyPoints: user.monthlyPoints || 0,
      totalCommission: user.totalCommission || 0,
      availableCommission: user.availableCommission || 0
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');

      // Prepare update data
      const updateData = {
        name: editingUser.name,
        username: editingUser.username,
        phone: editingUser.phone,
        country: editingUser.country,
        city: editingUser.city,
        role: editingUser.role,
        points: editingUser.points,
        monthlyPoints: editingUser.monthlyPoints,
        totalCommission: editingUser.totalCommission,
        availableCommission: editingUser.availableCommission
      };

      // Add subscriberCode if changed
      if (editingUser.subscriberCode && editingUser.subscriberCode !== editingUser.subscriberCodeOriginal) {
        updateData.subscriberCode = editingUser.subscriberCode;
      }

      // Add newSponsorCode if changed
      if (editingUser.newSponsorCode && editingUser.newSponsorCode.trim() !== '') {
        updateData.newSponsorCode = editingUser.newSponsorCode;
      }

      await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم تحديث المستخدم بنجاح!' : 'User updated successfully!');
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      setTimeout(() => setError(''), 3000);
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

    try {
      const token = localStorage.getItem('token');
      const { confirmPassword, ...userData } = newUser;

      await axios.post(
        'http://localhost:5000/api/admin/users',
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
        country: '',
        city: '',
        role: 'customer',
        sponsorCode: ''
      });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إضافة المستخدم' : 'Failed to add user'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title - Always use English in PDF to avoid encoding issues
    doc.setFontSize(18);
    doc.text('Users Report', 14, 22);

    // Add date
    doc.setFontSize(11);
    const date = new Date().toLocaleDateString('en-US');
    doc.text(`Date: ${date}`, 14, 30);

    // Add total count
    doc.text(`Total Users: ${filteredUsers.length}`, 14, 37);

    // Prepare table data - Always use English in PDF
    const tableColumn = [
      'Name',
      'Username',
      'Phone',
      'Role',
      'Registered'
    ];

    const tableRows = filteredUsers.map(user => [
      user.name,
      user.username,
      user.phone || '-',
      user.role === 'super_admin'
        ? 'Super Admin'
        : user.role === 'regional_admin'
        ? 'Regional Admin'
        : user.role === 'subscriber'
        ? 'Subscriber'
        : 'Customer',
      new Date(user.createdAt).toLocaleDateString('en-US')
    ]);

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Save PDF
    doc.save(`users-report-${new Date().getTime()}.pdf`);
    setMessage(language === 'ar' ? 'تم تصدير التقرير بنجاح!' : 'Report exported successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
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
              ? `إجمالي المستخدمين: ${users.length}`
              : `Total Users: ${users.length}`}
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
            placeholder={language === 'ar' ? 'بحث عن مستخدم...' : 'Search users...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="um-role-filter">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
            <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
            <option value="subscriber">{language === 'ar' ? 'مشترك' : 'Subscriber'}</option>
            <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
              <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
              <th>{language === 'ar' ? 'الدور' : 'Role'}</th>
              <th>{language === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td className="um-username">{user.username}</td>
                <td>{user.phone}</td>
                <td>
                  <select
                    className={`um-role-badge ${user.role}`}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  >
                    <option value="customer">{language === 'ar' ? 'عميل' : 'Customer'}</option>
                    <option value="subscriber">{language === 'ar' ? 'مشترك' : 'Subscriber'}</option>
                    <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
                    <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
                  </select>
                </td>
                <td className="um-date">
                  {new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
                <td>
                  <button
                    className="um-edit-btn"
                    onClick={() => handleEditUser(user)}
                  >
                    ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
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
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
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
                    <option value="supplier">{language === 'ar' ? 'مورد' : 'Supplier'}</option>
                    <option value="regional_admin">{language === 'ar' ? 'مسؤول إقليمي' : 'Regional Admin'}</option>
                    <option value="super_admin">{language === 'ar' ? 'مسؤول رئيسي' : 'Super Admin'}</option>
                  </select>
                </div>
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                  <input
                    type="text"
                    value={editingUser.country}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                  />
                </div>
                <div className="um-form-group">
                  <label>{language === 'ar' ? 'المدينة' : 'City'}</label>
                  <input
                    type="text"
                    value={editingUser.city}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                  />
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
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'كود الراعي (من أحاله)' : 'Sponsor Code (Who referred)'}</label>
                      <input
                        type="text"
                        value={editingUser.newSponsorCode}
                        onChange={(e) => setEditingUser({ ...editingUser, newSponsorCode: e.target.value.toUpperCase() })}
                        placeholder={editingUser.sponsorCode || (language === 'ar' ? 'أدخل كود الراعي الجديد' : 'Enter new sponsor code')}
                      />
                      <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        {language === 'ar'
                          ? `الراعي الحالي: ${editingUser.sponsorCode || 'لا يوجد'}`
                          : `Current sponsor: ${editingUser.sponsorCode || 'None'}`}
                      </small>
                    </div>
                  </div>

                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'النقاط' : 'Points'}</label>
                      <input
                        type="number"
                        value={editingUser.points}
                        onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'النقاط الشهرية' : 'Monthly Points'}</label>
                      <input
                        type="number"
                        value={editingUser.monthlyPoints}
                        onChange={(e) => setEditingUser({ ...editingUser, monthlyPoints: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="um-form-row">
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'إجمالي العمولات' : 'Total Commission'}</label>
                      <input
                        type="number"
                        value={editingUser.totalCommission}
                        onChange={(e) => setEditingUser({ ...editingUser, totalCommission: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>{language === 'ar' ? 'العمولات المتاحة' : 'Available Commission'}</label>
                      <input
                        type="number"
                        value={editingUser.availableCommission}
                        onChange={(e) => setEditingUser({ ...editingUser, availableCommission: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
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

      {/* Add User Modal */}
      {showAddForm && (
        <div className="um-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="um-modal um-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
              <button className="um-modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="um-modal-body">
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'اسم المستخدم *' : 'Username *'}</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
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
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      minLength="6"
                      required
                    />
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                    <input
                      type="password"
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
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
                      <option value="supplier">{language === 'ar' ? 'مورد' : 'Supplier'}</option>
                    </select>
                  </div>
                </div>

                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                    <input
                      type="text"
                      value={newUser.country}
                      onChange={(e) => setNewUser({ ...newUser, country: e.target.value })}
                    />
                  </div>
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'المدينة' : 'City'}</label>
                    <input
                      type="text"
                      value={newUser.city}
                      onChange={(e) => setNewUser({ ...newUser, city: e.target.value })}
                    />
                  </div>
                </div>

                {newUser.role === 'member' && (
                  <div className="um-form-group">
                    <label>{language === 'ar' ? 'كود الراعي (اختياري)' : 'Sponsor Code (Optional)'}</label>
                    <input
                      type="text"
                      value={newUser.sponsorCode}
                      onChange={(e) => setNewUser({ ...newUser, sponsorCode: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل كود الراعي لربط العضو بشجرة العمولات' : 'Enter sponsor code to link member to commission tree'}
                    />
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
    </div>
  );
};

export default UserManagement;
