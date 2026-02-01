import React, { useState, useEffect } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Admin.css';

const SuppliersManagement = () => {
  const { language } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    country: '',
    city: '',
    address: '',
    taxNumber: '',
    category: 'other',
    paymentTerms: 'cash',
    notes: '',
    role: 'supplier'
  });

  const countries = [
    { value: 'Egypt', label: 'Egypt - مصر' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia - السعودية' },
    { value: 'UAE', label: 'UAE - الإمارات' },
    { value: 'Kuwait', label: 'Kuwait - الكويت' },
    { value: 'Qatar', label: 'Qatar - قطر' },
    { value: 'Bahrain', label: 'Bahrain - البحرين' },
    { value: 'Oman', label: 'Oman - عُمان' },
    { value: 'Jordan', label: 'Jordan - الأردن' },
    { value: 'Lebanon', label: 'Lebanon - لبنان' },
    { value: 'Palestine', label: 'Palestine - فلسطين' },
    { value: 'Syria', label: 'Syria - سوريا' },
    { value: 'Iraq', label: 'Iraq - العراق' },
    { value: 'Yemen', label: 'Yemen - اليمن' },
    { value: 'Libya', label: 'Libya - ليبيا' },
    { value: 'Tunisia', label: 'Tunisia - تونس' },
    { value: 'Algeria', label: 'Algeria - الجزائر' },
    { value: 'Morocco', label: 'Morocco - المغرب' },
    { value: 'Sudan', label: 'Sudan - السودان' }
  ];

  const supplierCategories = [
    { value: 'electronics', label: language === 'ar' ? 'إلكترونيات' : 'Electronics' },
    { value: 'clothing', label: language === 'ar' ? 'ملابس' : 'Clothing' },
    { value: 'food', label: language === 'ar' ? 'مواد غذائية' : 'Food' },
    { value: 'cosmetics', label: language === 'ar' ? 'مستحضرات تجميل' : 'Cosmetics' },
    { value: 'home', label: language === 'ar' ? 'أدوات منزلية' : 'Home' },
    { value: 'sports', label: language === 'ar' ? 'رياضة' : 'Sports' },
    { value: 'other', label: language === 'ar' ? 'أخرى' : 'Other' }
  ];

  const paymentTermsOptions = [
    { value: 'cash', label: language === 'ar' ? 'نقدي' : 'Cash' },
    { value: 'net_15', label: language === 'ar' ? 'صافي 15 يوم' : 'Net 15' },
    { value: 'net_30', label: language === 'ar' ? 'صافي 30 يوم' : 'Net 30' },
    { value: 'net_60', label: language === 'ar' ? 'صافي 60 يوم' : 'Net 60' }
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      companyName: '',
      phone: '',
      email: '',
      country: '',
      city: '',
      address: '',
      taxNumber: '',
      category: 'other',
      paymentTerms: 'cash',
      notes: '',
      role: 'supplier'
    });
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for new supplier
    if (!editingSupplier) {
      if (!formData.username || !formData.password || !formData.name || !formData.phone) {
        alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة (اسم المستخدم، كلمة المرور، الاسم، رقم الهاتف)' : 'Please fill all required fields (username, password, name, phone)');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
        return;
      }
    }

    try {
      if (editingSupplier) {
        // For update, don't send password fields if empty
        const { password, confirmPassword, username, role, ...updateData } = formData;
        await updateSupplier(editingSupplier._id, updateData);
        alert(language === 'ar' ? 'تم تحديث المورد بنجاح' : 'Supplier updated successfully');
      } else {
        // For create, remove confirmPassword and ensure role is set
        const { confirmPassword, ...supplierData } = formData;
        supplierData.role = 'supplier';
        await createSupplier(supplierData);
        alert(language === 'ar' ? 'تم إضافة المورد بنجاح' : 'Supplier added successfully');
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert(error.response?.data?.message || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name || '',
      companyName: supplier.companyName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      country: supplier.country || '',
      city: supplier.city || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || '',
      category: supplier.category || 'other',
      paymentTerms: supplier.paymentTerms || 'cash',
      notes: supplier.notes || ''
    });
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        alert(language === 'ar' ? 'تم حذف المورد بنجاح' : 'Supplier deleted successfully');
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert(language === 'ar' ? 'فشل في حذف المورد' : 'Failed to delete supplier');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleSupplierStatus(id);
      fetchSuppliers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>{language === 'ar' ? 'إدارة الموردين' : 'Suppliers Management'}</h2>
        <button
          className="add-btn"
          onClick={() => { setShowForm(!showForm); setEditingSupplier(null); }}
        >
          {showForm ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'إضافة مورد' : 'Add Supplier')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="supplier-form product-form" autoComplete="off">
          <h4>{editingSupplier ? (language === 'ar' ? 'تعديل المورد' : 'Edit Supplier') : (language === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier')}</h4>
          <div className="form-grid">
            {!editingSupplier && (
              <>
                <div className="form-group">
                  <label>{language === 'ar' ? 'اسم المستخدم' : 'Username'} *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={language === 'ar' ? 'اسم المستخدم للدخول' : 'Username for login'}
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'كلمة المرور' : 'Password'} *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label>{language === 'ar' ? 'اسم المورد' : 'Supplier Name'} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'اسم الشركة' : 'Company Name'} *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'} *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'الدولة' : 'Country'} *</label>
              <select name="country" value={formData.country} onChange={handleChange} required>
                <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                {countries.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'المدينة' : 'City'} *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'العنوان' : 'Address'}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}</label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'التصنيف' : 'Category'}</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {supplierCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}</label>
              <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                {paymentTermsOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group full-width">
            <label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="submit-btn">
              {editingSupplier ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إضافة المورد' : 'Add Supplier')}
            </button>
            <button type="button" className="cancel-btn" onClick={resetForm}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'كود المورد' : 'Code'}</th>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'الشركة' : 'Company'}</th>
              <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
              <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
              <th>{language === 'ar' ? 'المدينة' : 'City'}</th>
              <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier._id}>
                <td><strong>{supplier.supplierCode}</strong></td>
                <td>{supplier.name}</td>
                <td>{supplier.companyName}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.country}</td>
                <td>{supplier.city}</td>
                <td>{supplierCategories.find(c => c.value === supplier.category)?.label || supplier.category}</td>
                <td>
                  <span className={`status ${supplier.isActive ? 'active' : 'inactive'}`}>
                    {supplier.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </span>
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleEdit(supplier)} className="edit-btn">
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button onClick={() => handleToggleStatus(supplier._id)} className="view-btn">
                    {supplier.isActive ? (language === 'ar' ? 'تعطيل' : 'Disable') : (language === 'ar' ? 'تفعيل' : 'Enable')}
                  </button>
                  <button onClick={() => handleDelete(supplier._id)} className="delete-btn">
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && suppliers.length === 0 && (
        <div className="no-data">
          {language === 'ar' ? 'لا يوجد موردين. قم بإضافة مورد جديد.' : 'No suppliers found. Add a new supplier.'}
        </div>
      )}
    </div>
  );
};

export default SuppliersManagement;
