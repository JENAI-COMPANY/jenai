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

  useEffect(() => {
    fetchCategories();
  }, []);

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

  if (loading) {
    return <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="category-management">
      <div className="category-header">
        <h2>{language === 'ar' ? 'إدارة الأقسام' : 'Category Management'}</h2>
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
          <form onSubmit={handleSubmit} className="category-form">
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
  );
};

export default CategoryManagement;
