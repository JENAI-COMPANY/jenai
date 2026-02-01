import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import '../styles/CategoryManagement.css';

const CategoryManagement = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    displayOrder: 0,
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [categoryAdmins, setCategoryAdmins] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCategoryId, setAssignCategoryId] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchCategoryAdmins();
  }, []);

  const fetchCategoryAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Get only category admins
      const admins = response.data.users.filter(u => u.role === 'category_admin');
      setCategoryAdmins(admins);
    } catch (err) {
      console.error('Error fetching category admins:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل تحميل الأقسام' : 'Failed to load categories'));
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      displayOrder: 0,
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.nameAr.trim() || !formData.nameEn.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم القسم بالعربي والإنجليزي' : 'Please enter category name in both languages');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('nameAr', formData.nameAr.trim());
      submitData.append('nameEn', formData.nameEn.trim());
      submitData.append('name', formData.nameAr.trim()); // Use Arabic name as default
      submitData.append('descriptionAr', formData.descriptionAr);
      submitData.append('descriptionEn', formData.descriptionEn);
      submitData.append('displayOrder', formData.displayOrder);
      submitData.append('isActive', formData.isActive);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingCategory) {
        // Update existing category
        await axios.put(
          `/api/categories/${editingCategory._id}`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم تحديث القسم بنجاح!' : 'Category updated successfully!');
      } else {
        // Add new category
        await axios.post(
          '/api/categories',
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم إضافة القسم بنجاح!' : 'Category added successfully!');
      }

      fetchCategories();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في حفظ القسم' : 'Failed to save category'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      nameAr: category.nameAr || '',
      nameEn: category.nameEn || '',
      descriptionAr: category.descriptionAr || '',
      descriptionEn: category.descriptionEn || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive
    });
    if (category.image) {
      setImagePreview(category.image);
    }
    setShowAddForm(true);
  };

  const handleDelete = async (categoryName) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/categories/${categoryName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم حذف القسم بنجاح!' : 'Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في حذف القسم' : 'Failed to delete category'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleManageAdmins = (category) => {
    setAssignCategoryId(category._id);
    // Get current admins for this category
    const currentAdmins = categoryAdmins.filter(admin =>
      admin.managedCategories?.includes(category.nameEn)
    );
    setSelectedAdmins(currentAdmins.map(a => a._id));
    setShowAssignModal(true);
  };

  const handleAdminToggle = (adminId) => {
    setSelectedAdmins(prev =>
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleSaveAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const category = categories.find(c => c._id === assignCategoryId);

      if (!category) return;

      // Update all category admins
      for (const admin of categoryAdmins) {
        let managedCategories = admin.managedCategories || [];

        if (selectedAdmins.includes(admin._id)) {
          // Add category if not already managed
          if (!managedCategories.includes(category.nameEn)) {
            managedCategories.push(category.nameEn);
          }
        } else {
          // Remove category if currently managed
          managedCategories = managedCategories.filter(c => c !== category.nameEn);
        }

        // Update user
        await axios.put(
          `/api/admin/users/${admin._id}`,
          { managedCategories },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setMessage(language === 'ar' ? 'تم تحديث مديري القسم بنجاح!' : 'Category admins updated successfully!');
      setShowAssignModal(false);
      fetchCategoryAdmins();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في تحديث مديري القسم' : 'Failed to update category admins'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setAdminFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: ''
    });
    setShowAdminForm(true);
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setAdminFormData({
      name: admin.name,
      username: admin.username,
      password: '',
      email: admin.email || '',
      phone: admin.phone || ''
    });
    setShowAdminForm(true);
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;

    // Validate username to only allow English letters, numbers, underscore, and hyphen
    if (name === 'username') {
      const englishOnly = value.replace(/[^a-zA-Z0-9_-]/g, '');
      setAdminFormData({
        ...adminFormData,
        [name]: englishOnly
      });
    } else {
      setAdminFormData({
        ...adminFormData,
        [name]: value
      });
    }
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (editingAdmin) {
        // Update existing admin
        const updateData = {
          name: adminFormData.name,
          username: adminFormData.username,
          email: adminFormData.email,
          phone: adminFormData.phone
        };
        if (adminFormData.password) {
          updateData.password = adminFormData.password;
        }

        await axios.put(
          `/api/admin/users/${editingAdmin._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(language === 'ar' ? 'تم تحديث مدير القسم بنجاح!' : 'Category admin updated successfully!');
      } else {
        // Create new admin
        await axios.post(
          '/api/admin/users',
          {
            ...adminFormData,
            role: 'category_admin'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage(language === 'ar' ? 'تم إضافة مدير القسم بنجاح!' : 'Category admin added successfully!');
      }

      setShowAdminForm(false);
      fetchCategoryAdmins();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في حفظ مدير القسم' : 'Failed to save category admin'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المدير؟' : 'Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم حذف مدير القسم بنجاح!' : 'Category admin deleted successfully!');
      fetchCategoryAdmins();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في حذف مدير القسم' : 'Failed to delete category admin'));
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="category-management">
      <div className="category-header">
        <h2>{language === 'ar' ? 'إدارة الأقسام والمديرين' : 'Categories & Admins Management'}</h2>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            {language === 'ar' ? 'الأقسام' : 'Categories'}
          </button>
          <button
            className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            {language === 'ar' ? 'مدراء الأقسام' : 'Category Admins'}
          </button>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="tab-content">
          <div className="category-header">
            <h3>{language === 'ar' ? 'إدارة الأقسام' : 'Category Management'}</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-category-btn"
        >
          {showAddForm ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? '+ إضافة قسم' : '+ Add Category')}
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="category-form-container">
          <h3>{editingCategory ? (language === 'ar' ? 'تعديل القسم' : 'Edit Category') : (language === 'ar' ? 'إضافة قسم جديد' : 'Add New Category')}</h3>
          <form onSubmit={handleSubmit} className="category-form" autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <label>{language === 'ar' ? 'الاسم بالعربي' : 'Name in Arabic'} *</label>
                <input
                  type="text"
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'اسم القسم بالعربي' : 'Category name in Arabic'}
                  required
                />
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'Name in English'} *</label>
                <input
                  type="text"
                  name="nameEn"
                  value={formData.nameEn}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'اسم القسم بالإنجليزي' : 'Category name in English'}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{language === 'ar' ? 'الوصف بالعربي' : 'Description in Arabic'}</label>
                <textarea
                  name="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'وصف القسم بالعربي' : 'Category description in Arabic'}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'الوصف بالإنجليزي' : 'Description in English'}</label>
                <textarea
                  name="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'وصف القسم بالإنجليزي' : 'Category description in English'}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{language === 'ar' ? 'ترتيب العرض' : 'Display Order'}</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>{language === 'ar' ? 'القسم نشط' : 'Category Active'}</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'صورة القسم' : 'Category Image'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-input"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingCategory ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة القسم' : 'Add Category')}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="categories-list">
        <h3>{language === 'ar' ? 'الأقسام الموجودة' : 'Existing Categories'}</h3>
        {categories.length === 0 ? (
          <div className="no-categories">
            {language === 'ar' ? 'لا توجد أقسام' : 'No categories found'}
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id} className={`category-card ${!category.isActive ? 'inactive' : ''}`}>
                {category.image && (
                  <div className="category-card-image">
                    <img src={category.image} alt={language === 'ar' ? category.nameAr : category.nameEn} />
                  </div>
                )}
                <div className="category-info">
                  <h4>{language === 'ar' ? category.nameAr : category.nameEn}</h4>
                  {(category.descriptionAr || category.descriptionEn) && (
                    <p className="category-description">
                      {language === 'ar' ? category.descriptionAr : category.descriptionEn}
                    </p>
                  )}
                  <div className="category-meta">
                    <span className="display-order">
                      {language === 'ar' ? 'الترتيب' : 'Order'}: {category.displayOrder}
                    </span>
                    <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </div>
                </div>
                <div className="category-actions">
                  <button onClick={() => handleEdit(category)} className="edit-btn">
                    ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button onClick={() => handleManageAdmins(category)} className="manage-admins-btn">
                    👥 {language === 'ar' ? 'إدارة المديرين' : 'Manage Admins'}
                  </button>
                  <button onClick={() => handleDelete(category.name)} className="delete-btn">
                    🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Category Admins Tab */}
      {activeTab === 'admins' && (
        <div className="tab-content">
          <div className="category-header">
            <h3>{language === 'ar' ? 'مدراء الأقسام' : 'Category Admins'}</h3>
            <button
              onClick={handleAddAdmin}
              className="add-category-btn"
            >
              {language === 'ar' ? '+ إضافة مدير قسم' : '+ Add Category Admin'}
            </button>
          </div>

          {/* Admin Form */}
          {showAdminForm && (
            <div className="category-form-container">
              <h3>{editingAdmin ? (language === 'ar' ? 'تعديل مدير القسم' : 'Edit Category Admin') : (language === 'ar' ? 'إضافة مدير قسم جديد' : 'Add New Category Admin')}</h3>
              <form onSubmit={handleSubmitAdmin} className="category-form" autoComplete="off">
                <div className="form-row">
                  <div className="form-group">
                    <label>{language === 'ar' ? 'الاسم' : 'Name'} *</label>
                    <input
                      type="text"
                      name="name"
                      value={adminFormData.name}
                      onChange={handleAdminFormChange}
                      placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{language === 'ar' ? 'اسم المستخدم' : 'Username'} *</label>
                    <input
                      type="text"
                      name="username"
                      value={adminFormData.username}
                      onChange={handleAdminFormChange}
                      placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{language === 'ar' ? 'كلمة المرور' : 'Password'} {!editingAdmin && '*'}</label>
                    <input
                      type="password"
                      name="password"
                      value={adminFormData.password}
                      onChange={handleAdminFormChange}
                      placeholder={editingAdmin ? (language === 'ar' ? 'اتركه فارغاً لعدم التغيير' : 'Leave empty to keep unchanged') : (language === 'ar' ? 'كلمة المرور' : 'Password')}
                      required={!editingAdmin}
                    />
                  </div>
                  <div className="form-group">
                    <label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input
                      type="email"
                      name="email"
                      value={adminFormData.email}
                      onChange={handleAdminFormChange}
                      placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    name="phone"
                    value={adminFormData.phone}
                    onChange={handleAdminFormChange}
                    placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editingAdmin ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add')}
                  </button>
                  <button type="button" onClick={() => setShowAdminForm(false)} className="cancel-btn">
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Admins List */}
          <div className="admins-list-section">
            <h3>{language === 'ar' ? 'قائمة مدراء الأقسام' : 'Category Admins List'}</h3>
            {categoryAdmins.length === 0 ? (
              <div className="no-categories">
                {language === 'ar' ? 'لا يوجد مدراء أقسام' : 'No category admins'}
              </div>
            ) : (
              <div className="admins-grid">
                {categoryAdmins.map(admin => (
                  <div key={admin._id} className="admin-card">
                    <div className="admin-card-header">
                      <h4>{admin.name}</h4>
                      <span className="admin-username">@{admin.username}</span>
                    </div>
                    <div className="admin-card-body">
                      {admin.email && (
                        <div className="admin-detail">
                          <strong>{language === 'ar' ? 'البريد:' : 'Email:'}</strong> {admin.email}
                        </div>
                      )}
                      {admin.phone && (
                        <div className="admin-detail">
                          <strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {admin.phone}
                        </div>
                      )}
                      {admin.managedCategories && admin.managedCategories.length > 0 && (
                        <div className="admin-detail">
                          <strong>{language === 'ar' ? 'يدير:' : 'Manages:'}</strong>
                          <div className="managed-categories">
                            {admin.managedCategories.map((cat, idx) => (
                              <span key={idx} className="category-tag">{cat}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="admin-card-actions">
                      <button onClick={() => handleEditAdmin(admin)} className="edit-btn">
                        ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button onClick={() => handleDeleteAdmin(admin._id)} className="delete-btn">
                        🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Admins Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{language === 'ar' ? 'إدارة مديري القسم' : 'Manage Category Admins'}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                {language === 'ar'
                  ? 'اختر المديرين المصرح لهم بإدارة منتجات هذا القسم فقط'
                  : 'Select admins authorized to manage products in this category only'}
              </p>
              {categoryAdmins.length === 0 ? (
                <div className="no-admins">
                  {language === 'ar' ? 'لا يوجد مديري أقسام متاحين' : 'No category admins available'}
                </div>
              ) : (
                <div className="admins-list">
                  {categoryAdmins.map(admin => (
                    <label key={admin._id} className="admin-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedAdmins.includes(admin._id)}
                        onChange={() => handleAdminToggle(admin._id)}
                      />
                      <div className="admin-info">
                        <div className="admin-name">{admin.name}</div>
                        <div className="admin-username">@{admin.username}</div>
                        {admin.managedCategories?.length > 0 && (
                          <div className="admin-categories">
                            {language === 'ar' ? 'يدير: ' : 'Manages: '}{admin.managedCategories.join(', ')}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleSaveAdmins} className="save-btn">
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
              <button onClick={() => setShowAssignModal(false)} className="cancel-btn">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
