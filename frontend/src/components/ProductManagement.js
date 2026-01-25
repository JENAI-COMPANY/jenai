import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/ProductManagement.css';

const ProductManagement = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegionData, setNewRegionData] = useState({ nameAr: '', nameEn: '', code: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerPrice: '',
    subscriberPrice: '',
    bulkPrice: '',
    bulkMinQuantity: '',
    category: '',
    stock: '',
    points: '',
    region: 'all', // default: all regions
    supplier: '', // المورد المسؤول عن المنتج
    isActive: true,
    isNewArrival: false,
    // خصم الزباين (العملاء)
    customerDiscount: {
      enabled: false,
      originalPrice: '',
      discountedPrice: ''
    },
    // خصم الأعضاء
    subscriberDiscount: {
      enabled: false,
      originalPrice: '',
      discountedPrice: ''
    }
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user && user.role === 'super_admin') {
      fetchRegions();
      fetchSuppliers();
    }
    // regional_admin يحتاج أيضاً لمعلومات المناطق لعرض اسم منطقته
    if (user && user.role === 'regional_admin') {
      fetchRegions();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.data || response.data.products || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/regions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched regions:', response.data);
      setRegions(response.data.regions || response.data.data || []);
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = response.data.users || [];
      setSuppliers(allUsers.filter(u => u.role === 'supplier'));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleAddRegion = async () => {
    if (!newRegionData.nameAr.trim() || !newRegionData.nameEn.trim() || !newRegionData.code.trim()) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/regions',
        {
          name: newRegionData.nameEn.trim(), // Use English name as the main name
          nameAr: newRegionData.nameAr.trim(),
          nameEn: newRegionData.nameEn.trim(),
          code: newRegionData.code.trim().toUpperCase()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم إضافة المنطقة بنجاح!' : 'Region added successfully!');
      setNewRegionData({ nameAr: '', nameEn: '', code: '' });
      setShowAddRegion(false);
      fetchRegions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل في إضافة المنطقة' : 'Failed to add region'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      setError(language === 'ar' ? 'القسم موجود بالفعل' : 'Category already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/categories',
        { name: newCategoryName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories(prev => [...prev, newCategoryName.trim()]);
      setFormData({ ...formData, category: newCategoryName.trim() });
      setNewCategoryName('');
      setShowAddCategory(false);
      setMessage(language === 'ar' ? 'تمت إضافة القسم بنجاح' : 'Category added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل إضافة القسم' : 'Failed to add category'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف قسم "${categoryName}"؟` : `Are you sure you want to delete category "${categoryName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/categories/${encodeURIComponent(categoryName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories(prev => prev.filter(cat => cat !== categoryName));
      setMessage(language === 'ar' ? 'تم حذف القسم بنجاح' : 'Category deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'فشل حذف القسم' : 'Failed to delete category'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prevFiles => [...prevFiles, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, {
          file: file,
          url: reader.result,
          type: file.type.startsWith('video') ? 'video' : 'image'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one image is uploaded for new products
    if (!editingProduct && mediaPreviews.length === 0) {
      setError(language === 'ar' ? 'يجب إضافة صورة واحدة على الأقل' : 'At least one image is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('customerPrice', formData.customerPrice);
      formDataToSend.append('subscriberPrice', formData.subscriberPrice);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('isActive', formData.isActive);
      formDataToSend.append('isNewArrival', formData.isNewArrival);

      // إضافة المنطقة (فقط لـ super_admin)
      if (user && user.role === 'super_admin' && formData.region) {
        formDataToSend.append('region', formData.region);
      }

      if (formData.bulkPrice) formDataToSend.append('bulkPrice', formData.bulkPrice);
      if (formData.bulkMinQuantity) formDataToSend.append('bulkMinQuantity', formData.bulkMinQuantity);
      if (formData.points) formDataToSend.append('points', formData.points);

      // إضافة المورد (إذا تم اختياره)
      if (formData.supplier && formData.supplier !== '') {
        formDataToSend.append('supplier', formData.supplier);
      }

      // إضافة بيانات الخصم
      formDataToSend.append('customerDiscount', JSON.stringify(formData.customerDiscount));
      formDataToSend.append('subscriberDiscount', JSON.stringify(formData.subscriberDiscount));

      // Append media files
      mediaFiles.forEach((file) => {
        formDataToSend.append('media', file);
      });

      if (editingProduct) {
        // Update existing product
        await axios.put(
          `/api/products/${editingProduct._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!');
      } else {
        // Create new product
        await axios.post(
          '/api/products',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم إضافة المنتج بنجاح!' : 'Product added successfully!');
      }

      resetForm();
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      customerPrice: product.customerPrice || '',
      subscriberPrice: product.subscriberPrice || '',
      bulkPrice: product.bulkPrice || '',
      bulkMinQuantity: product.bulkMinQuantity || '',
      category: product.category || '',
      stock: product.stock || '',
      points: product.points || '',
      region: product.region?._id || product.region || 'all',
      supplier: product.supplier?._id || product.supplier || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      isNewArrival: product.isNewArrival || false,
      customerDiscount: product.customerDiscount || {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      subscriberDiscount: product.subscriberDiscount || {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      }
    });

    // Load existing media as previews
    if (product.media && product.media.length > 0) {
      const existingPreviews = product.media.map(item => ({
        url: item.url,
        type: item.type,
        existing: true
      }));
      setMediaPreviews(existingPreviews);
    }

    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم حذف المنتج بنجاح!' : 'Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      customerPrice: '',
      subscriberPrice: '',
      bulkPrice: '',
      bulkMinQuantity: '',
      category: '',
      stock: '',
      points: '',
      region: 'all',
      supplier: '',
      isActive: true,
      isNewArrival: false,
      customerDiscount: {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      subscriberDiscount: {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      }
    });
    setMediaFiles([]);
    setMediaPreviews([]);
    setEditingProduct(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="pm-loading">
        <div className="pm-spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading products...'}</p>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="pm-header">
        <h2>{language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}</h2>
        <button className="pm-add-btn" onClick={() => setShowAddForm(true)}>
          + {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
        </button>
      </div>

      {error && <div className="pm-alert pm-alert-error">{error}</div>}
      {message && <div className="pm-alert pm-alert-success">{message}</div>}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="pm-modal-overlay" onClick={() => !editingProduct && resetForm()}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3>{editingProduct ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product')}</h3>
              <button className="pm-modal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="pm-form">
              <div className="pm-form-grid">
                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'اسم المنتج' : 'Product Name'} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'القسم' : 'Category'}</label>
                  <div className="pm-category-input">
                    <select
                      value={showManageCategories || showAddCategory ? '' : formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowAddCategory(true);
                          setShowManageCategories(false);
                        } else if (e.target.value === '__manage__') {
                          setShowManageCategories(true);
                          setShowAddCategory(false);
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                          setShowAddCategory(false);
                          setShowManageCategories(false);
                        }
                      }}
                      className="pm-category-select"
                    >
                      <option value="">{language === 'ar' ? 'اختر القسم' : 'Select Category'}</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                      <option value="__add_new__">+ {language === 'ar' ? 'إضافة قسم جديد' : 'Add New Category'}</option>
                      <option value="__manage__">⚙️ {language === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}</option>
                    </select>

                    {showAddCategory && (
                      <div className="pm-add-category-popup">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={language === 'ar' ? 'اسم القسم الجديد' : 'New category name'}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button type="button" onClick={handleAddCategory} className="pm-btn-add-cat">
                          ✓
                        </button>
                        <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="pm-btn-cancel-cat">
                          ✕
                        </button>
                      </div>
                    )}

                    {showManageCategories && (
                      <div className="pm-manage-categories-popup">
                        <div className="pm-manage-header">
                          <h4>{language === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}</h4>
                          <button type="button" onClick={() => setShowManageCategories(false)} className="pm-close-btn">✕</button>
                        </div>
                        <div className="pm-category-list">
                          {categories.length === 0 ? (
                            <p className="pm-no-categories">{language === 'ar' ? 'لا توجد أقسام' : 'No categories'}</p>
                          ) : (
                            categories.map((cat, index) => (
                              <div key={index} className="pm-category-item">
                                <span>{cat}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="pm-delete-category-btn"
                                  title={language === 'ar' ? 'حذف' : 'Delete'}
                                >
                                  🗑️
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pm-form-group pm-full-width">
                  <label>{language === 'ar' ? 'الوصف' : 'Description'}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                {/* حقل المنطقة - للـ super_admin و regional_admin */}
                {user && (user.role === 'super_admin' || user.role === 'regional_admin') && (
                  <div className="pm-form-group">
                    <label>{language === 'ar' ? 'المنطقة' : 'Region'}</label>

                    {/* super_admin: يختار المنطقة */}
                    {user.role === 'super_admin' ? (
                      <div className="pm-category-input">
                        <select
                          value={showAddRegion ? '' : formData.region}
                          onChange={(e) => {
                            if (e.target.value === '__add_new__') {
                              setShowAddRegion(true);
                            } else {
                              setFormData({ ...formData, region: e.target.value });
                              setShowAddRegion(false);
                            }
                          }}
                          className="pm-category-select"
                        >
                          <option value="all">{language === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>
                          {regions.map((region) => (
                            <option key={region._id} value={region._id}>
                              {language === 'ar' ? region.nameAr : region.nameEn}
                            </option>
                          ))}
                          <option value="__add_new__">+ {language === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Region'}</option>
                        </select>

                      {showAddRegion && (
                        <div className="pm-add-category-popup pm-add-region-popup">
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                              {language === 'ar' ? 'الاسم بالعربي *' : 'Arabic Name *'}
                            </label>
                            <input
                              type="text"
                              value={newRegionData.nameAr}
                              onChange={(e) => setNewRegionData({ ...newRegionData, nameAr: e.target.value })}
                              placeholder={language === 'ar' ? 'مثال: فلسطين' : 'Example: فلسطين'}
                              style={{ width: '100%' }}
                              dir="rtl"
                            />
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                              {language === 'ar' ? 'الاسم بالإنجليزي *' : 'English Name *'}
                            </label>
                            <input
                              type="text"
                              value={newRegionData.nameEn}
                              onChange={(e) => setNewRegionData({ ...newRegionData, nameEn: e.target.value })}
                              placeholder={language === 'ar' ? 'مثال: Palestine' : 'Example: Palestine'}
                              style={{ width: '100%' }}
                              dir="ltr"
                            />
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                              {language === 'ar' ? 'رمز المنطقة *' : 'Region Code *'}
                            </label>
                            <input
                              type="text"
                              value={newRegionData.code}
                              onChange={(e) => setNewRegionData({ ...newRegionData, code: e.target.value.toUpperCase() })}
                              placeholder={language === 'ar' ? 'مثال: PS' : 'Example: PS'}
                              maxLength="3"
                              style={{ textTransform: 'uppercase', width: '100%' }}
                              dir="ltr"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                            <button type="button" onClick={handleAddRegion} className="pm-btn-add-cat">
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddRegion(false);
                                setNewRegionData({ nameAr: '', nameEn: '', code: '' });
                              }}
                              className="pm-btn-cancel-cat"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    ) : (
                      /* regional_admin: يعرض منطقته فقط (معطل) */
                      <div>
                        <input
                          type="text"
                          value={user.region ? (language === 'ar' ? user.region.nameAr : user.region.nameEn) : (language === 'ar' ? 'جاري التحميل...' : 'Loading...')}
                          disabled
                          className="pm-category-select"
                          style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                        />
                        <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>
                          {language === 'ar' ? 'سيتم إضافة المنتج تلقائياً لمنطقتك' : 'Product will be added to your region automatically'}
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* حقل المورد - يظهر فقط لـ super_admin */}
                {user && user.role === 'super_admin' && (
                  <div className="pm-form-group">
                    <label>{language === 'ar' ? 'المورد' : 'Supplier'}</label>
                    <select
                      value={formData.supplier || ''}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="pm-category-select"
                    >
                      <option value="">{language === 'ar' ? 'لا يوجد' : 'None'}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} (@{supplier.username})
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {language === 'ar' ? 'المورد المسؤول عن هذا المنتج' : 'Supplier responsible for this product'}
                    </small>
                  </div>
                )}

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'سعر العميل' : 'Customer Price'} *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.customerPrice}
                    onChange={(e) => setFormData({ ...formData, customerPrice: e.target.value })}
                    required
                    placeholder={language === 'ar' ? 'السعر للعملاء' : 'Price for customers'}
                  />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'سعر المشترك' : 'Subscriber Price'} *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subscriberPrice}
                    onChange={(e) => setFormData({ ...formData, subscriberPrice: e.target.value })}
                    required
                    placeholder={language === 'ar' ? 'السعر للمشتركين' : 'Price for subscribers'}
                  />
                </div>

                {/* خصم الزباين (العملاء) */}
                <div className="pm-form-section pm-discount-section">
                  <h4>{language === 'ar' ? 'خصم الزباين (العملاء العاديين)' : 'Customer Discount'}</h4>

                  <div className="pm-form-group pm-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.customerDiscount.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          customerDiscount: {
                            ...formData.customerDiscount,
                            enabled: e.target.checked
                          }
                        })}
                      />
                      <span>{language === 'ar' ? 'تفعيل خصم للزباين' : 'Enable Customer Discount'}</span>
                    </label>
                  </div>

                  {formData.customerDiscount.enabled && (
                    <div className="pm-form-row">
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.customerDiscount.originalPrice}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerDiscount: {
                              ...formData.customerDiscount,
                              originalPrice: e.target.value
                            }
                          })}
                          placeholder={language === 'ar' ? 'السعر قبل الخصم' : 'Price before discount'}
                        />
                      </div>
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر بعد الخصم' : 'Discounted Price'}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.customerDiscount.discountedPrice}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerDiscount: {
                              ...formData.customerDiscount,
                              discountedPrice: e.target.value
                            }
                          })}
                          placeholder={language === 'ar' ? 'السعر بعد الخصم' : 'Price after discount'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* خصم الأعضاء */}
                <div className="pm-form-section pm-discount-section">
                  <h4>{language === 'ar' ? 'خصم الأعضاء' : 'Member Discount'}</h4>

                  <div className="pm-form-group pm-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.subscriberDiscount.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          subscriberDiscount: {
                            ...formData.subscriberDiscount,
                            enabled: e.target.checked
                          }
                        })}
                      />
                      <span>{language === 'ar' ? 'تفعيل خصم للأعضاء' : 'Enable Member Discount'}</span>
                    </label>
                  </div>

                  {formData.subscriberDiscount.enabled && (
                    <div className="pm-form-row">
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.subscriberDiscount.originalPrice}
                          onChange={(e) => setFormData({
                            ...formData,
                            subscriberDiscount: {
                              ...formData.subscriberDiscount,
                              originalPrice: e.target.value
                            }
                          })}
                          placeholder={language === 'ar' ? 'السعر قبل الخصم' : 'Price before discount'}
                        />
                      </div>
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر بعد الخصم' : 'Discounted Price'}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.subscriberDiscount.discountedPrice}
                          onChange={(e) => setFormData({
                            ...formData,
                            subscriberDiscount: {
                              ...formData.subscriberDiscount,
                              discountedPrice: e.target.value
                            }
                          })}
                          placeholder={language === 'ar' ? 'السعر بعد الخصم' : 'Price after discount'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'سعر الجملة' : 'Bulk Price'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bulkPrice}
                    onChange={(e) => setFormData({ ...formData, bulkPrice: e.target.value })}
                  />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'الحد الأدنى للجملة' : 'Bulk Min Quantity'}</label>
                  <input
                    type="number"
                    value={formData.bulkMinQuantity}
                    onChange={(e) => setFormData({ ...formData, bulkMinQuantity: e.target.value })}
                  />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'الكمية المتاحة' : 'Stock'} *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'النقاط' : 'Points'}</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  />
                </div>

                <div className="pm-form-group pm-full-width">
                  <label>
                    {language === 'ar' ? 'الصور والفيديوهات' : 'Images & Videos'}
                    <span className="pm-required"> * {language === 'ar' ? '(الصورة الأولى مطلوبة)' : '(First image required)'}</span>
                  </label>
                  <div className="pm-media-upload">
                    <input
                      type="file"
                      id="media-upload"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="media-upload" className="pm-upload-btn">
                      📤 {language === 'ar' ? 'اختر الصور/الفيديوهات' : 'Choose Images/Videos'}
                    </label>
                  </div>

                  {/* Media Previews */}
                  {mediaPreviews.length > 0 && (
                    <div className="pm-media-previews">
                      {mediaPreviews.map((media, index) => (
                        <div key={index} className="pm-media-preview-item">
                          {index === 0 && (
                            <span className="pm-primary-badge">
                              {language === 'ar' ? 'رئيسية' : 'Primary'}
                            </span>
                          )}
                          {media.type === 'video' ? (
                            <video src={media.url} controls className="pm-preview-video" />
                          ) : (
                            <img src={media.url} alt={`Preview ${index + 1}`} className="pm-preview-image" />
                          )}
                          <button
                            type="button"
                            className="pm-remove-media"
                            onClick={() => removeMedia(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {language === 'ar' ? 'منتج نشط' : 'Active Product'}
                  </label>
                </div>

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    />
                    {language === 'ar' ? '🎁 وصل حديثاً' : '🎁 New Arrival'}
                  </label>
                </div>
              </div>

              <div className="pm-form-actions">
                <button type="submit" className="pm-save-btn">
                  {editingProduct ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إضافة المنتج' : 'Add Product')}
                </button>
                <button type="button" className="pm-cancel-btn" onClick={resetForm}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="pm-table-wrapper">
        <table className="pm-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'الصورة' : 'Image'}</th>
              <th>{language === 'ar' ? 'اسم المنتج' : 'Name'}</th>
              <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
              <th>{language === 'ar' ? 'سعر العميل' : 'Customer Price'}</th>
              <th>{language === 'ar' ? 'سعر المشترك' : 'Subscriber Price'}</th>
              <th>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="pm-no-data">
                  {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id || product._id}>
                  <td>
                    {product.media && product.media.length > 0 ? (
                      product.media[0].type === 'video' ? (
                        <video src={product.media[0].url} className="pm-product-img" />
                      ) : (
                        <img src={product.media[0].url} alt={product.name} className="pm-product-img" />
                      )
                    ) : product.image ? (
                      <img src={product.image} alt={product.name} className="pm-product-img" />
                    ) : (
                      <div className="pm-no-image">📦</div>
                    )}
                  </td>
                  <td className="pm-product-name">{product.name}</td>
                  <td>{product.category || '-'}</td>
                  <td className="pm-price">${product.customerPrice?.toFixed(2) || product.price?.toFixed(2) || '0.00'}</td>
                  <td className="pm-price">${product.subscriberPrice?.toFixed(2) || product.price?.toFixed(2) || '0.00'}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`pm-status-badge ${product.isActive ? 'pm-active' : 'pm-inactive'}`}>
                      {product.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="pm-actions">
                      <button className="pm-edit-btn" onClick={() => handleEdit(product)}>
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button className="pm-delete-btn" onClick={() => handleDelete(product._id)}>
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

export default ProductManagement;
