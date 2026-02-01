import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/SupplierManagement.css';

const SupplierManagement = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newSupplier, setNewSupplier] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    country: '',
    city: '',
    companyName: '',
    taxId: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = response.data.users || [];
      setSuppliers(allUsers.filter(u => u.role === 'supplier'));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحميل الموردين' : 'Failed to load suppliers'));
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newSupplier.username || !newSupplier.password || !newSupplier.name || !newSupplier.phone) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validate passwords match
    if (newSupplier.password !== newSupplier.confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const { confirmPassword, ...supplierData } = newSupplier;
      supplierData.role = 'supplier';

      await axios.post(
        '/api/admin/users',
        supplierData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم إضافة المورد بنجاح!' : 'Supplier added successfully!');
      setShowAddForm(false);
      setNewSupplier({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        country: '',
        city: '',
        companyName: '',
        taxId: ''
      });
      fetchSuppliers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إضافة المورد' : 'Failed to add supplier'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier({
      ...supplier,
      companyName: supplier.companyName || '',
      taxId: supplier.taxId || ''
    });
  };

  const handleUpdateSupplier = async () => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: editingSupplier.name,
        phone: editingSupplier.phone,
        country: editingSupplier.country,
        city: editingSupplier.city,
        companyName: editingSupplier.companyName,
        taxId: editingSupplier.taxId
      };

      await axios.put(
        `/api/admin/users/${editingSupplier._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم تحديث المورد بنجاح!' : 'Supplier updated successfully!');
      setEditingSupplier(null);
      fetchSuppliers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحديث المورد' : 'Failed to update supplier'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${supplierId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(language === 'ar' ? 'تم حذف المورد بنجاح!' : 'Supplier deleted successfully!');
      fetchSuppliers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في حذف المورد' : 'Failed to delete supplier'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    if (typeof searchTerm === 'string' && searchTerm.trim() === '') return true;

    const search = (searchTerm || '').toLowerCase();
    const name = (supplier.name || '').toLowerCase();
    const username = (supplier.username || '').toLowerCase();
    const phone = supplier.phone || '';
    const companyName = (supplier.companyName || '').toLowerCase();

    return (
      name.includes(search) ||
      username.includes(search) ||
      phone.includes(search) ||
      companyName.includes(search)
    );
  });

  if (loading) {
    return <div className="sm-loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="sm-container">
      <div className="sm-header">
        <h2>{language === 'ar' ? 'إدارة الموردين' : 'Supplier Management'}</h2>
        <button className="sm-add-btn" onClick={() => setShowAddForm(true)}>
          + {language === 'ar' ? 'إضافة مورد' : 'Add Supplier'}
        </button>
      </div>

      {error && <div className="sm-error">{error}</div>}
      {message && <div className="sm-success">{message}</div>}

      <div className="sm-search">
        <input
          type="text"
          placeholder={language === 'ar' ? 'بحث عن مورد...' : 'Search suppliers...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sm-stats">
        <div className="sm-stat-card">
          <h3>{suppliers.length}</h3>
          <p>{language === 'ar' ? 'إجمالي الموردين' : 'Total Suppliers'}</p>
        </div>
      </div>

      <div className="sm-table-container">
        <table className="sm-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
              <th>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
              <th>{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</th>
              <th>{language === 'ar' ? 'الموقع' : 'Location'}</th>
              <th>{language === 'ar' ? 'تاريخ التسجيل' : 'Registered'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(supplier => (
              <tr key={supplier._id}>
                <td>{supplier.name}</td>
                <td className="sm-username">{supplier.username}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.companyName || '-'}</td>
                <td>{supplier.city}, {supplier.country}</td>
                <td className="sm-date">
                  {new Date(supplier.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
                <td>
                  <button
                    className="sm-edit-btn"
                    onClick={() => handleEditSupplier(supplier)}
                  >
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    className="sm-delete-btn"
                    onClick={() => handleDeleteSupplier(supplier._id)}
                  >
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Form */}
      {showAddForm && (
        <div className="sm-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>{language === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier'}</h3>
              <button className="sm-modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSupplier} autoComplete="off">
              <div className="sm-modal-body">
                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'اسم المستخدم *' : 'Username *'}</label>
                    <input
                      type="text"
                      value={newSupplier.username}
                      onChange={(e) => setNewSupplier({ ...newSupplier, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
                    <input
                      type="password"
                      value={newSupplier.password}
                      onChange={(e) => setNewSupplier({ ...newSupplier, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                    <input
                      type="password"
                      value={newSupplier.confirmPassword}
                      onChange={(e) => setNewSupplier({ ...newSupplier, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                    <input
                      type="tel"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</label>
                    <input
                      type="text"
                      value={newSupplier.companyName}
                      onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                    <input
                      type="text"
                      value={newSupplier.country}
                      onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                    />
                  </div>
                  <div className="sm-form-group">
                    <label>{language === 'ar' ? 'المدينة' : 'City'}</label>
                    <input
                      type="text"
                      value={newSupplier.city}
                      onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</label>
                  <input
                    type="text"
                    value={newSupplier.taxId}
                    onChange={(e) => setNewSupplier({ ...newSupplier, taxId: e.target.value })}
                  />
                </div>
              </div>
              <div className="sm-modal-footer">
                <button type="submit" className="sm-save-btn">
                  {language === 'ar' ? 'إضافة المورد' : 'Add Supplier'}
                </button>
                <button type="button" className="sm-cancel-btn" onClick={() => setShowAddForm(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="sm-modal-overlay" onClick={() => setEditingSupplier(null)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3>{language === 'ar' ? 'تعديل بيانات المورد' : 'Edit Supplier'}</h3>
              <button className="sm-modal-close" onClick={() => setEditingSupplier(null)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  />
                </div>
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input
                    type="tel"
                    value={editingSupplier.phone}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</label>
                  <input
                    type="text"
                    value={editingSupplier.companyName}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, companyName: e.target.value })}
                  />
                </div>
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</label>
                  <input
                    type="text"
                    value={editingSupplier.taxId}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="sm-form-row">
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'الدولة' : 'Country'}</label>
                  <input
                    type="text"
                    value={editingSupplier.country}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, country: e.target.value })}
                  />
                </div>
                <div className="sm-form-group">
                  <label>{language === 'ar' ? 'المدينة' : 'City'}</label>
                  <input
                    type="text"
                    value={editingSupplier.city}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="sm-modal-footer">
              <button className="sm-save-btn" onClick={handleUpdateSupplier}>
                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
              <button className="sm-cancel-btn" onClick={() => setEditingSupplier(null)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
