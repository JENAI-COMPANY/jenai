import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import '../styles/UserManagement.css';

const RegionsManagement = () => {
  const { language } = useLanguage();
  const [regions, setRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [newRegion, setNewRegion] = useState({
    name: '',
    nameAr: '',
    nameEn: '',
    code: '',
    description: '',
    regionalAdmin: ''
  });

  useEffect(() => {
    fetchRegions();
    fetchUsers();
  }, []);

  const fetchRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/regions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegions(response.data.regions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError(err.response?.data?.message || 'Failed to load regions');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only users with regional_admin role
      const admins = (response.data.users || []).filter(
        u => u.role === 'regional_admin'
      );
      setUsers(admins);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateRegion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      // Clean data - remove empty regionalAdmin
      const regionData = { ...newRegion };
      if (!regionData.regionalAdmin) {
        delete regionData.regionalAdmin;
      }

      console.log('Creating region with data:', regionData);

      await axios.post(
        '/api/admin/regions',
        regionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم إضافة المنطقة بنجاح!' : 'Region added successfully!');
      setShowAddForm(false);
      setNewRegion({
        name: '',
        nameAr: '',
        nameEn: '',
        code: '',
        description: '',
        regionalAdmin: ''
      });
      fetchRegions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create region');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateRegion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      // Clean data - remove empty regionalAdmin
      const regionData = { ...editingRegion };
      if (!regionData.regionalAdmin || regionData.regionalAdmin === '') {
        delete regionData.regionalAdmin;
      }

      await axios.put(
        `/api/admin/regions/${editingRegion._id}`,
        regionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم تحديث المنطقة بنجاح!' : 'Region updated successfully!');
      setEditingRegion(null);
      fetchRegions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update region');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteRegion = async (regionId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المنطقة؟' : 'Are you sure you want to delete this region?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/admin/regions/${regionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم حذف المنطقة بنجاح!' : 'Region deleted successfully!');
      fetchRegions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete region');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingRegion) {
      setEditingRegion({ ...editingRegion, [name]: value });
    } else {
      setNewRegion({ ...newRegion, [name]: value });
    }
  };

  if (loading) {
    return <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>{language === 'ar' ? 'إدارة المناطق' : 'Regions Management'}</h2>
        <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? '+ إضافة منطقة' : '+ Add Region')}
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Add Region Form */}
      {showAddForm && (
        <form onSubmit={handleCreateRegion} className="add-form">
          <div className="form-grid">
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم (عام)' : 'Name'} *</label>
              <input
                type="text"
                name="name"
                value={newRegion.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالعربي' : 'Arabic Name'} *</label>
              <input
                type="text"
                name="nameAr"
                value={newRegion.nameAr}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'English Name'} *</label>
              <input
                type="text"
                name="nameEn"
                value={newRegion.nameEn}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'الكود' : 'Code'} *</label>
              <input
                type="text"
                name="code"
                value={newRegion.code}
                onChange={handleInputChange}
                maxLength="3"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'المدير الإقليمي (اختياري)' : 'Regional Admin (Optional)'}</label>
              <select
                name="regionalAdmin"
                value={newRegion.regionalAdmin}
                onChange={handleInputChange}
              >
                <option value="">{language === 'ar' ? 'بدون مدير - سيتم تعيينه لاحقاً' : 'No Admin - Assign Later'}</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {language === 'ar' ? 'يمكنك تعيين المدير عند إنشاء مستخدم بدور "أدمن إقليمي"' : 'You can assign admin when creating a user with "Regional Admin" role'}
              </small>
            </div>

            <div className="form-group full-width">
              <label>{language === 'ar' ? 'الوصف' : 'Description'}</label>
              <textarea
                name="description"
                value={newRegion.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {language === 'ar' ? 'إضافة' : 'Add'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* Edit Region Modal */}
      {editingRegion && (
        <div className="modal-overlay" onClick={() => setEditingRegion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{language === 'ar' ? 'تعديل المنطقة' : 'Edit Region'}</h3>
            <form onSubmit={handleUpdateRegion}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{language === 'ar' ? 'الاسم (عام)' : 'Name'} *</label>
                  <input
                    type="text"
                    name="name"
                    value={editingRegion.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'الاسم بالعربي' : 'Arabic Name'} *</label>
                  <input
                    type="text"
                    name="nameAr"
                    value={editingRegion.nameAr}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'English Name'} *</label>
                  <input
                    type="text"
                    name="nameEn"
                    value={editingRegion.nameEn}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'الكود' : 'Code'} *</label>
                  <input
                    type="text"
                    name="code"
                    value={editingRegion.code}
                    onChange={handleInputChange}
                    maxLength="3"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'المدير الإقليمي' : 'Regional Admin'}</label>
                  <select
                    name="regionalAdmin"
                    value={editingRegion.regionalAdmin?._id || editingRegion.regionalAdmin || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">{language === 'ar' ? 'بدون مدير' : 'No Admin'}</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>{language === 'ar' ? 'الوصف' : 'Description'}</label>
                  <textarea
                    name="description"
                    value={editingRegion.description || ''}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditingRegion(null)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regions Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'الكود' : 'Code'}</th>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'الاسم بالعربي' : 'Arabic Name'}</th>
              <th>{language === 'ar' ? 'المدير الإقليمي' : 'Regional Admin'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {regions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  {language === 'ar' ? 'لا توجد مناطق' : 'No regions found'}
                </td>
              </tr>
            ) : (
              regions.map((region) => (
                <tr key={region._id}>
                  <td><strong>{region.code}</strong></td>
                  <td>{region.name}</td>
                  <td>{region.nameAr}</td>
                  <td>{region.regionalAdmin?.name || (language === 'ar' ? 'غير محدد' : 'Not assigned')}</td>
                  <td>
                    <span className={`status ${region.isActive ? 'active' : 'inactive'}`}>
                      {region.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => setEditingRegion(region)}
                      >
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRegion(region._id)}
                      >
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegionsManagement;
