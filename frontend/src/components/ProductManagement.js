import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/ProductManagement.css';
import MobileDrawer from './MobileDrawer';

// Deep-parse nested JSON strings (fixes multiple JSON.stringify calls issue)
const deepParseOptions = (options) => {
  if (!options) return [];
  let current = Array.isArray(options) ? options : [options];
  // Flatten and deep-parse all items
  const result = [];
  for (const item of current) {
    let val = item;
    // Keep parsing as long as we get a string that looks like JSON
    for (let i = 0; i < 10; i++) {
      if (typeof val !== 'string') break;
      const trimmed = val.trim();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('"') && !trimmed.startsWith('{')) break;
      try { val = JSON.parse(trimmed); } catch { break; }
    }
    if (Array.isArray(val)) {
      result.push(...deepParseOptions(val));
    } else if (typeof val === 'string' && val.trim()) {
      result.push(val.trim());
    }
  }
  return result;
};

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
    weight: '',
    points: '',
    region: 'all', // default: all regions
    supplier: '', // المورد المسؤول عن المنتج
    isActive: true,
    isNewArrival: false,
    isOffer: false,
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
    },
    // خيارات اللون والنمرة
    hasColorOptions: false,
    colors: [],
    hasSizeOptions: false,
    sizes: [],
    mediaToDelete: [] // قائمة URLs الصور المحذوفة
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [stockFilter, setStockFilter] = useState('all'); // all, inStock, outOfStock
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or specific category
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const mobileHandler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', mobileHandler);
    return () => window.removeEventListener('resize', mobileHandler);
  }, []);

  const handlePrint = () => {
    const filtered = products.filter(product => {
      if (stockFilter === 'inStock' && product.stock <= 0) return false;
      if (stockFilter === 'outOfStock' && product.stock > 0) return false;
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
      return true;
    });

    const categoryLabel = categoryFilter === 'all'
      ? (language === 'ar' ? 'كل الأقسام' : 'All Categories')
      : categoryFilter;

    const stockLabel = stockFilter === 'all'
      ? (language === 'ar' ? 'الكل' : 'All')
      : stockFilter === 'inStock'
        ? (language === 'ar' ? 'متوفر' : 'In Stock')
        : (language === 'ar' ? 'نفذ' : 'Out of Stock');

    const rows = filtered.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name || '-'}</td>
        <td>${p.category || '-'}</td>
        <td>₪${p.customerPrice?.toFixed(2) || p.price?.toFixed(2) || '0.00'}</td>
        <td>₪${p.subscriberPrice?.toFixed(2) || p.price?.toFixed(2) || '0.00'}</td>
        <td>${p.stock ?? '-'}</td>
        <td>${p.isActive ? '✅ نشط' : '❌ غير نشط'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>قائمة المنتجات</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          h2 { color: #22513e; }
          .info { color: #555; margin-bottom: 12px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #22513e; color: white; padding: 8px 10px; }
          td { border: 1px solid #ddd; padding: 7px 10px; font-size: 13px; }
          tr:nth-child(even) td { background: #f5f5f5; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h2>🛒 قائمة المنتجات - جيناي</h2>
        <div class="info">
          القسم: <strong>${categoryLabel}</strong> &nbsp;|&nbsp;
          الحالة: <strong>${stockLabel}</strong> &nbsp;|&nbsp;
          العدد: <strong>${filtered.length}</strong> منتج
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المنتج</th>
              <th>الفئة</th>
              <th>سعر الزبون</th>
              <th>سعر العضو</th>
              <th>المخزون</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user && user.role === 'super_admin') {
      fetchRegions();
      fetchSuppliers();
    }
    // regional_admin و category_admin يحتاجان أيضاً لمعلومات المناطق
    if (user && (user.role === 'regional_admin' || user.role === 'category_admin')) {
      fetchRegions();
    }
  }, []);

  useEffect(() => {
    console.log('🔍 Category Filter changed:', categoryFilter);
    console.log('🔍 Total products:', products.length);
    const filtered = products.filter(product => {
      if (stockFilter === 'inStock' && product.stock <= 0) return false;
      if (stockFilter === 'outOfStock' && product.stock > 0) return false;
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        console.log(`❌ Product "${product.name}" category "${product.category}" !== filter "${categoryFilter}"`);
        return false;
      }
      return true;
    });
    console.log('🔍 Filtered products:', filtered.length);
  }, [categoryFilter, stockFilter, products]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all products for admin panel (no pagination limit)
      const response = await axios.get('/api/products?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = response.data.data || response.data.products || [];
      console.log('📦 Products fetched:', productsData.length);
      console.log('📦 Social Media products:', productsData.filter(p => p.category === 'قسم خدمات السوشيال ميديا').length);
      setProducts(productsData);
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
      // Extract category names (strings) for backward compatibility with Product model
      const cats = response.data.categories || [];
      const categoryNames = cats.map(cat => typeof cat === 'string' ? cat : cat.nameAr || cat.name || '');
      setCategories(categoryNames);
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

    if (files.length === 0) return;

    // إضافة الملفات أولاً
    setMediaFiles(prevFiles => [...prevFiles, ...files]);

    // Create previews with file reference
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setMediaPreviews(prev => [...prev, {
            file: file,
            url: reader.result,
            type: file.type.startsWith('video') ? 'video' : 'image',
            isNew: true // علامة للصور الجديدة
          }]);
        }
      };
      reader.onerror = () => {
        console.error('خطأ في قراءة الملف:', file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    const mediaToRemove = mediaPreviews[index];

    // إذا كانت صورة موجودة مسبقاً، نضيفها لقائمة الصور المحذوفة
    if (mediaToRemove && mediaToRemove.existing) {
      setFormData(prev => ({
        ...prev,
        mediaToDelete: [...(prev.mediaToDelete || []), mediaToRemove.url]
      }));
    }

    // حذف الصورة من القائمة
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));

    // إذا كانت صورة جديدة، نحذفها من mediaFiles أيضاً
    if (mediaToRemove && mediaToRemove.isNew) {
      // البحث عن الملف المطابق وحذفه
      setMediaFiles(prev => {
        const fileToRemove = mediaToRemove.file;
        return prev.filter(f => f !== fileToRemove);
      });
    }
  };

  // إضافة لون جديد
  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  // حذف لون
  const removeColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  // إضافة نمرة جديدة
  const addSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()]
      }));
      setNewSize('');
    }
  };

  // حذف نمرة
  const removeSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(size => size !== sizeToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate category is selected
    if (!formData.category || formData.category.trim() === '') {
      setError(language === 'ar' ? 'يرجى اختيار القسم' : 'Please select a category');
      setTimeout(() => setError(''), 3000);
      return;
    }

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
      formDataToSend.append('isOffer', formData.isOffer);

      // إضافة المنطقة (لـ super_admin و category_admin)
      if (user && (user.role === 'super_admin' || user.role === 'category_admin') && formData.region) {
        formDataToSend.append('region', formData.region);
      }

      if (formData.bulkPrice) formDataToSend.append('bulkPrice', formData.bulkPrice);
      if (formData.bulkMinQuantity) formDataToSend.append('bulkMinQuantity', formData.bulkMinQuantity);
      if (formData.weight) formDataToSend.append('weight', formData.weight);
      if (formData.points) formDataToSend.append('points', formData.points);

      // إضافة المورد (إذا تم اختياره)
      if (formData.supplier && formData.supplier !== '') {
        formDataToSend.append('supplier', formData.supplier);
      }

      // إضافة بيانات الخصم
      formDataToSend.append('customerDiscount', JSON.stringify(formData.customerDiscount));
      formDataToSend.append('subscriberDiscount', JSON.stringify(formData.subscriberDiscount));

      // إضافة خيارات اللون والنمرة - كل قيمة على حدى بدون JSON.stringify
      formDataToSend.append('hasColorOptions', formData.hasColorOptions);
      formData.colors.forEach(c => formDataToSend.append('colors', c));
      formDataToSend.append('hasSizeOptions', formData.hasSizeOptions);
      formData.sizes.forEach(s => formDataToSend.append('sizes', s));

      // Append media files
      mediaFiles.forEach((file) => {
        formDataToSend.append('media', file);
      });

      // إرسال قائمة الصور المحذوفة عند التعديل
      if (editingProduct && formData.mediaToDelete && formData.mediaToDelete.length > 0) {
        formDataToSend.append('mediaToDelete', JSON.stringify(formData.mediaToDelete));
      }

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
      weight: product.weight || '',
      points: product.points || '',
      region: product.region?._id || product.region || 'all',
      supplier: product.supplier?._id || product.supplier || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      isNewArrival: product.isNewArrival || false,
      isOffer: product.isOffer || false,
      customerDiscount: product.customerDiscount || {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      subscriberDiscount: product.subscriberDiscount || {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      hasColorOptions: product.hasColorOptions || false,
      colors: deepParseOptions(product.colors || []),
      hasSizeOptions: product.hasSizeOptions || false,
      sizes: deepParseOptions(product.sizes || []),
      mediaToDelete: [] // قائمة فارغة عند بدء التعديل
    });

    // Load existing media as previews
    setMediaFiles([]); // نظف الملفات الجديدة
    if (product.media && product.media.length > 0) {
      const existingPreviews = product.media.map(item => ({
        url: item.url,
        type: item.type,
        existing: true
      }));
      setMediaPreviews(existingPreviews);
    } else {
      setMediaPreviews([]);
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
      weight: '',
      points: '',
      region: 'all',
      supplier: '',
      isActive: true,
      isNewArrival: false,
      isOffer: false,
      customerDiscount: {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      subscriberDiscount: {
        enabled: false,
        originalPrice: '',
        discountedPrice: ''
      },
      hasColorOptions: false,
      colors: [],
      hasSizeOptions: false,
      sizes: [],
      mediaToDelete: []
    });
    setMediaFiles([]);
    setMediaPreviews([]);
    setNewColor('');
    setNewSize('');
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

  // Check if user has permission to view products
  if (user && user.role === 'regional_admin' && user.permissions && !user.permissions.canViewProducts) {
    return (
      <div className="pm-loading" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>
          {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
        </h2>
        <p style={{ color: '#666' }}>
          {language === 'ar'
            ? 'ليس لديك صلاحية لعرض المنتجات. يرجى التواصل مع المسؤول الرئيسي.'
            : 'You do not have permission to view products. Please contact the main administrator.'}
        </p>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="pm-header">
        <h2>{language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}</h2>
        <div className="pm-header-controls">
          {/* Stock Filters */}
          <div className="pm-stock-filters">
            <button
              className={`pm-filter-btn ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              className={`pm-filter-btn ${stockFilter === 'inStock' ? 'active' : ''}`}
              onClick={() => setStockFilter('inStock')}
            >
              {language === 'ar' ? 'متوفر' : 'In Stock'}
            </button>
            <button
              className={`pm-filter-btn ${stockFilter === 'outOfStock' ? 'active' : ''}`}
              onClick={() => setStockFilter('outOfStock')}
            >
              {language === 'ar' ? 'نفذ' : 'Out of Stock'}
            </button>
          </div>

          {/* Category Filter Dropdown */}
          {categories.length > 0 && (
            <select
              className="pm-category-dropdown"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">
                {language === 'ar' ? 'كل الأقسام' : 'All Categories'}
              </option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          <button className="pm-print-btn" onClick={handlePrint} title={language === 'ar' ? 'طباعة القائمة الحالية' : 'Print current list'}>
            🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
          </button>

          <button className="pm-add-btn" onClick={() => setShowAddForm(true)}>
            + {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
          </button>
        </div>
      </div>

      {error && <div className="pm-alert pm-alert-error">{error}</div>}
      {message && <div className="pm-alert pm-alert-success">{message}</div>}

      {/* Add/Edit Form Modal - Mobile Version */}
      <MobileDrawer
        isOpen={showAddForm}
        onClose={resetForm}
        title={editingProduct ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product')}
        footerButtons={
          <>
            <button className="pm-save-btn" onClick={handleSubmit} type="button">
              {editingProduct ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إضافة المنتج' : 'Add Product')}
            </button>
            <button className="pm-cancel-btn" type="button" onClick={resetForm}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </>
        }
      >
        {showAddForm && (
          <form onSubmit={handleSubmit} className="pm-form" autoComplete="off">
            {error && <div className="pm-alert pm-alert-error" style={{margin: '0 0 16px 0'}}>{error}</div>}
            {message && <div className="pm-alert pm-alert-success" style={{margin: '0 0 16px 0'}}>{message}</div>}
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
                  <label>{language === 'ar' ? 'القسم' : 'Category'} *</label>
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
                      required
                    >
                      <option value="">{language === 'ar' ? 'اختر القسم' : 'Select Category'}</option>
                      {categories
                        .filter(cat => {
                          if (user?.role === 'category_admin' && user?.managedCategories) {
                            return user.managedCategories.includes(cat);
                          }
                          return true;
                        })
                        .map((cat, index) => (
                          <option key={index} value={cat}>{cat}</option>
                        ))}
                      {user?.role !== 'category_admin' && (
                        <>
                          <option value="__add_new__">+ {language === 'ar' ? 'إضافة قسم جديد' : 'Add New Category'}</option>
                          <option value="__manage__">⚙️ {language === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}</option>
                        </>
                      )}
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
                        <button type="button" onClick={handleAddCategory} className="pm-btn-add-cat">✓</button>
                        <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="pm-btn-cancel-cat">✕</button>
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
                                <button type="button" onClick={() => handleDeleteCategory(cat)} className="pm-delete-category-btn" title={language === 'ar' ? 'حذف' : 'Delete'}>🗑️</button>
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

                {user && (user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'category_admin') && (
                  <div className="pm-form-group">
                    <label>{language === 'ar' ? 'المنطقة' : 'Region'}</label>
                    {(user.role === 'super_admin' || user.role === 'category_admin') ? (
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
                              <input type="text" value={newRegionData.nameAr} onChange={(e) => setNewRegionData({ ...newRegionData, nameAr: e.target.value })} placeholder={language === 'ar' ? 'مثال: فلسطين' : 'Example: فلسطين'} style={{ width: '100%' }} dir="rtl" />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                                {language === 'ar' ? 'الاسم بالإنجليزي *' : 'English Name *'}
                              </label>
                              <input type="text" value={newRegionData.nameEn} onChange={(e) => setNewRegionData({ ...newRegionData, nameEn: e.target.value })} placeholder={language === 'ar' ? 'مثال: Palestine' : 'Example: Palestine'} style={{ width: '100%' }} dir="ltr" />
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                                {language === 'ar' ? 'رمز المنطقة *' : 'Region Code *'}
                              </label>
                              <input type="text" value={newRegionData.code} onChange={(e) => setNewRegionData({ ...newRegionData, code: e.target.value.toUpperCase() })} placeholder={language === 'ar' ? 'مثال: PS' : 'Example: PS'} maxLength="3" style={{ textTransform: 'uppercase', width: '100%' }} dir="ltr" />
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                              <button type="button" onClick={handleAddRegion} className="pm-btn-add-cat">✓</button>
                              <button type="button" onClick={() => { setShowAddRegion(false); setNewRegionData({ nameAr: '', nameEn: '', code: '' }); }} className="pm-btn-cancel-cat">✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
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
                  <label>{language === 'ar' ? 'سعر الزبون' : 'Customer Price'} *</label>
                  <input type="number" step="0.01" value={formData.customerPrice} onChange={(e) => setFormData({ ...formData, customerPrice: e.target.value })} required placeholder={language === 'ar' ? 'السعر للعملاء' : 'Price for customers'} />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'سعر العضو' : 'Subscriber Price'} *</label>
                  <input type="number" step="0.01" value={formData.subscriberPrice} onChange={(e) => setFormData({ ...formData, subscriberPrice: e.target.value })} required placeholder={language === 'ar' ? 'السعر للمشتركين' : 'Price for subscribers'} />
                </div>

                <div className="pm-form-section pm-discount-section">
                  <h4>{language === 'ar' ? 'خصم الزباين (العملاء العاديين)' : 'Customer Discount'}</h4>
                  <div className="pm-form-group pm-checkbox-group">
                    <label>
                      <input type="checkbox" checked={formData.customerDiscount.enabled} onChange={(e) => setFormData({ ...formData, customerDiscount: { ...formData.customerDiscount, enabled: e.target.checked } })} />
                      <span>{language === 'ar' ? 'تفعيل خصم للزباين' : 'Enable Customer Discount'}</span>
                    </label>
                  </div>
                  {formData.customerDiscount.enabled && (
                    <div className="pm-form-row">
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</label>
                        <input type="number" step="0.01" value={formData.customerDiscount.originalPrice} onChange={(e) => setFormData({ ...formData, customerDiscount: { ...formData.customerDiscount, originalPrice: e.target.value } })} placeholder={language === 'ar' ? 'السعر قبل الخصم' : 'Price before discount'} />
                      </div>
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر بعد الخصم' : 'Discounted Price'}</label>
                        <input type="number" step="0.01" value={formData.customerDiscount.discountedPrice} onChange={(e) => setFormData({ ...formData, customerDiscount: { ...formData.customerDiscount, discountedPrice: e.target.value } })} placeholder={language === 'ar' ? 'السعر بعد الخصم' : 'Price after discount'} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pm-form-section pm-discount-section">
                  <h4>{language === 'ar' ? 'خصم الأعضاء' : 'Member Discount'}</h4>
                  <div className="pm-form-group pm-checkbox-group">
                    <label>
                      <input type="checkbox" checked={formData.subscriberDiscount.enabled} onChange={(e) => setFormData({ ...formData, subscriberDiscount: { ...formData.subscriberDiscount, enabled: e.target.checked } })} />
                      <span>{language === 'ar' ? 'تفعيل خصم للأعضاء' : 'Enable Member Discount'}</span>
                    </label>
                  </div>
                  {formData.subscriberDiscount.enabled && (
                    <div className="pm-form-row">
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</label>
                        <input type="number" step="0.01" value={formData.subscriberDiscount.originalPrice} onChange={(e) => setFormData({ ...formData, subscriberDiscount: { ...formData.subscriberDiscount, originalPrice: e.target.value } })} placeholder={language === 'ar' ? 'السعر قبل الخصم' : 'Price before discount'} />
                      </div>
                      <div className="pm-form-group">
                        <label>{language === 'ar' ? 'السعر بعد الخصم' : 'Discounted Price'}</label>
                        <input type="number" step="0.01" value={formData.subscriberDiscount.discountedPrice} onChange={(e) => setFormData({ ...formData, subscriberDiscount: { ...formData.subscriberDiscount, discountedPrice: e.target.value } })} placeholder={language === 'ar' ? 'السعر بعد الخصم' : 'Price after discount'} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'سعر الجملة' : 'Bulk Price'}</label>
                  <input type="number" step="0.01" value={formData.bulkPrice} onChange={(e) => setFormData({ ...formData, bulkPrice: e.target.value })} />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'الحد الأدنى للجملة' : 'Bulk Min Quantity'}</label>
                  <input type="number" value={formData.bulkMinQuantity} onChange={(e) => setFormData({ ...formData, bulkMinQuantity: e.target.value })} />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'الكمية المتاحة' : 'Stock'} *</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'الوزن' : 'Weight'}</label>
                  <input type="text" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} />
                </div>

                <div className="pm-form-group">
                  <label>{language === 'ar' ? 'النقاط' : 'Points'}</label>
                  <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} />
                </div>

                <div className="pm-form-group pm-full-width">
                  <div className="pm-checkbox">
                    <label>
                      <input type="checkbox" checked={formData.hasColorOptions} onChange={(e) => setFormData({ ...formData, hasColorOptions: e.target.checked })} />
                      {language === 'ar' ? '🎨 تفعيل خيارات الألوان' : '🎨 Enable Color Options'}
                    </label>
                  </div>
                  {formData.hasColorOptions && (
                    <div className="pm-options-container">
                      <div className="pm-add-option">
                        <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder={language === 'ar' ? 'أضف لون (مثال: أحمر، أزرق، أخضر)' : 'Add color (e.g. Red, Blue, Green)'} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} />
                        <button type="button" onClick={addColor} className="pm-add-btn">{language === 'ar' ? '+ إضافة' : '+ Add'}</button>
                      </div>
                      <div className="pm-options-list">
                        {formData.colors.map((color, index) => (
                          <span key={index} className="pm-option-tag">{color}<button type="button" onClick={() => removeColor(color)} className="pm-remove-tag">×</button></span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pm-form-group pm-full-width">
                  <div className="pm-checkbox">
                    <label>
                      <input type="checkbox" checked={formData.hasSizeOptions} onChange={(e) => setFormData({ ...formData, hasSizeOptions: e.target.checked })} />
                      {language === 'ar' ? '📏 تفعيل خيارات النمرة/المقاس' : '📏 Enable Size Options'}
                    </label>
                  </div>
                  {formData.hasSizeOptions && (
                    <div className="pm-options-container">
                      <div className="pm-add-option">
                        <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder={language === 'ar' ? 'أضف نمرة (مثال: S, M, L, XL أو 38, 40, 42)' : 'Add size (e.g. S, M, L, XL or 38, 40, 42)'} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }} />
                        <button type="button" onClick={addSize} className="pm-add-btn">{language === 'ar' ? '+ إضافة' : '+ Add'}</button>
                      </div>
                      <div className="pm-options-list">
                        {formData.sizes.map((size, index) => (
                          <span key={index} className="pm-option-tag">{size}<button type="button" onClick={() => removeSize(size)} className="pm-remove-tag">×</button></span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pm-form-group pm-full-width">
                  <label>
                    {language === 'ar' ? 'الصور والفيديوهات' : 'Images & Videos'}
                    <span className="pm-required"> * {language === 'ar' ? '(الصورة الأولى مطلوبة)' : '(First image required)'}</span>
                  </label>
                  <div className="pm-media-upload">
                    <input type="file" id="media-upload-mobile" multiple accept="image/*,video/*" onChange={handleMediaChange} style={{ display: 'none' }} />
                    <label htmlFor="media-upload-mobile" className="pm-upload-btn">
                      📤 {language === 'ar' ? 'اختر الصور/الفيديوهات' : 'Choose Images/Videos'}
                    </label>
                  </div>
                  {mediaPreviews.length > 0 && (
                    <div className="pm-media-previews">
                      {mediaPreviews.map((media, index) => (
                        <div key={index} className="pm-media-preview-item">
                          {index === 0 && <span className="pm-primary-badge">{language === 'ar' ? 'رئيسية' : 'Primary'}</span>}
                          {media.type === 'video' ? (
                            <video src={media.url} controls className="pm-preview-video" />
                          ) : (
                            <img src={media.url} alt={`Preview ${index + 1}`} className="pm-preview-image" />
                          )}
                          <button type="button" className="pm-remove-media" onClick={() => removeMedia(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                    {language === 'ar' ? 'منتج نشط' : 'Active Product'}
                  </label>
                </div>

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input type="checkbox" checked={formData.isNewArrival} onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })} />
                    {language === 'ar' ? '🎁 وصل حديثاً' : '🎁 New Arrival'}
                  </label>
                </div>

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input type="checkbox" checked={formData.isOffer} onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })} />
                    {language === 'ar' ? '🏷️ إضافة للعروض' : '🏷️ Add to Offers'}
                  </label>
                </div>
            </div>
          </form>
        )}
      </MobileDrawer>

      {/* Add/Edit Form Modal - Desktop Version */}
      {!isMobile && showAddForm && (
        <div className="pm-modal-overlay" onClick={() => !editingProduct && resetForm()}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3>{editingProduct ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product')}</h3>
              <button className="pm-modal-close" onClick={resetForm}>✕</button>
            </div>
            {error && <div className="pm-alert pm-alert-error" style={{margin: '0 0 16px 0'}}>{error}</div>}
            {message && <div className="pm-alert pm-alert-success" style={{margin: '0 0 16px 0'}}>{message}</div>}
            <form onSubmit={handleSubmit} className="pm-form" autoComplete="off">
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
                  <label>{language === 'ar' ? 'القسم' : 'Category'} *</label>
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
                      required
                    >
                      <option value="">{language === 'ar' ? 'اختر القسم' : 'Select Category'}</option>
                      {categories
                        .filter(cat => {
                          // Category admin can only see their managed categories
                          if (user?.role === 'category_admin' && user?.managedCategories) {
                            return user.managedCategories.includes(cat);
                          }
                          return true;
                        })
                        .map((cat, index) => (
                          <option key={index} value={cat}>{cat}</option>
                        ))}
                      {user?.role !== 'category_admin' && (
                        <>
                          <option value="__add_new__">+ {language === 'ar' ? 'إضافة قسم جديد' : 'Add New Category'}</option>
                          <option value="__manage__">⚙️ {language === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}</option>
                        </>
                      )}
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

                {/* حقل المنطقة - للـ super_admin و regional_admin و category_admin */}
                {user && (user.role === 'super_admin' || user.role === 'regional_admin' || user.role === 'category_admin') && (
                  <div className="pm-form-group">
                    <label>{language === 'ar' ? 'المنطقة' : 'Region'}</label>

                    {/* super_admin و category_admin: يختاران المنطقة */}
                    {(user.role === 'super_admin' || user.role === 'category_admin') ? (
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
                  <label>{language === 'ar' ? 'سعر الزبون' : 'Customer Price'} *</label>
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
                  <label>{language === 'ar' ? 'سعر العضو' : 'Subscriber Price'} *</label>
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
                  <label>{language === 'ar' ? 'الوزن' : 'Weight'}</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
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

                {/* خيارات اللون */}
                <div className="pm-form-group pm-full-width">
                  <div className="pm-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.hasColorOptions}
                        onChange={(e) => setFormData({ ...formData, hasColorOptions: e.target.checked })}
                      />
                      {language === 'ar' ? '🎨 تفعيل خيارات الألوان' : '🎨 Enable Color Options'}
                    </label>
                  </div>

                  {formData.hasColorOptions && (
                    <div className="pm-options-container">
                      <div className="pm-add-option">
                        <input
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder={language === 'ar' ? 'أضف لون (مثال: أحمر، أزرق، أخضر)' : 'Add color (e.g. Red, Blue, Green)'}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addColor();
                            }
                          }}
                        />
                        <button type="button" onClick={addColor} className="pm-add-btn">
                          {language === 'ar' ? '+ إضافة' : '+ Add'}
                        </button>
                      </div>
                      <div className="pm-options-list">
                        {formData.colors.map((color, index) => (
                          <span key={index} className="pm-option-tag">
                            {color}
                            <button type="button" onClick={() => removeColor(color)} className="pm-remove-tag">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* خيارات النمرة/المقاس */}
                <div className="pm-form-group pm-full-width">
                  <div className="pm-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.hasSizeOptions}
                        onChange={(e) => setFormData({ ...formData, hasSizeOptions: e.target.checked })}
                      />
                      {language === 'ar' ? '📏 تفعيل خيارات النمرة/المقاس' : '📏 Enable Size Options'}
                    </label>
                  </div>

                  {formData.hasSizeOptions && (
                    <div className="pm-options-container">
                      <div className="pm-add-option">
                        <input
                          type="text"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          placeholder={language === 'ar' ? 'أضف نمرة (مثال: S, M, L, XL أو 38, 40, 42)' : 'Add size (e.g. S, M, L, XL or 38, 40, 42)'}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSize();
                            }
                          }}
                        />
                        <button type="button" onClick={addSize} className="pm-add-btn">
                          {language === 'ar' ? '+ إضافة' : '+ Add'}
                        </button>
                      </div>
                      <div className="pm-options-list">
                        {formData.sizes.map((size, index) => (
                          <span key={index} className="pm-option-tag">
                            {size}
                            <button type="button" onClick={() => removeSize(size)} className="pm-remove-tag">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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

                <div className="pm-form-group pm-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isOffer}
                      onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })}
                    />
                    {language === 'ar' ? '🏷️ إضافة للعروض' : '🏷️ Add to Offers'}
                  </label>
                </div>
              </div>

              {error && <div className="pm-alert pm-alert-error" style={{marginBottom: '12px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600'}}>{error}</div>}
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
              <th>{language === 'ar' ? 'سعر الزبون' : 'Customer Price'}</th>
              <th>{language === 'ar' ? 'سعر العضو' : 'Subscriber Price'}</th>
              <th>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(product => {
              // Stock filter
              if (stockFilter === 'inStock' && product.stock <= 0) return false;
              if (stockFilter === 'outOfStock' && product.stock > 0) return false;

              // Category filter
              if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

              return true;
            }).length === 0 ? (
              <tr>
                <td colSpan="8" className="pm-no-data">
                  {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                </td>
              </tr>
            ) : (
              products.filter(product => {
                // Stock filter
                if (stockFilter === 'inStock' && product.stock <= 0) return false;
                if (stockFilter === 'outOfStock' && product.stock > 0) return false;

                // Category filter
                if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

                return true;
              }).map(product => (
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
                  <td className="pm-price">₪{product.customerPrice?.toFixed(2) || product.price?.toFixed(2) || '0.00'}</td>
                  <td className="pm-price">₪{product.subscriberPrice?.toFixed(2) || product.price?.toFixed(2) || '0.00'}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`pm-status-badge ${product.isActive ? 'pm-active' : 'pm-inactive'}`}>
                      {product.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="pm-actions">
                      {/* التحقق من صلاحيات مدير المنطقة */}
                      {(() => {
                        // Super admin يرى جميع الأزرار
                        if (user && user.role === 'super_admin') {
                          return (
                            <>
                              <button className="pm-edit-btn" onClick={() => handleEdit(product)}>
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              <button className="pm-delete-btn" onClick={() => handleDelete(product._id)}>
                                {language === 'ar' ? 'حذف' : 'Delete'}
                              </button>
                            </>
                          );
                        }
                        // Regional admin يرى الأزرار فقط لمنتجات منطقته
                        if (user && user.role === 'regional_admin') {
                          const productRegionId = product.region ? (product.region._id || product.region) : null;
                          const userRegionId = user.region ? (user.region._id || user.region) : null;

                          if (productRegionId && userRegionId && productRegionId.toString() === userRegionId.toString()) {
                            return (
                              <>
                                <button className="pm-edit-btn" onClick={() => handleEdit(product)}>
                                  {language === 'ar' ? 'تعديل' : 'Edit'}
                                </button>
                                <button className="pm-delete-btn" onClick={() => handleDelete(product._id)}>
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </button>
                              </>
                            );
                          } else {
                            return (
                              <span className="pm-no-permission">
                                {language === 'ar' ? 'لا توجد صلاحية' : 'No permission'}
                              </span>
                            );
                          }
                        }
                        // Category admin يرى الأزرار فقط لمنتجات أقسامه
                        if (user && user.role === 'category_admin') {
                          const productCategory = product.category;
                          const userManagedCategories = user.managedCategories || [];

                          if (productCategory && userManagedCategories.includes(productCategory)) {
                            return (
                              <>
                                <button className="pm-edit-btn" onClick={() => handleEdit(product)}>
                                  {language === 'ar' ? 'تعديل' : 'Edit'}
                                </button>
                                <button className="pm-delete-btn" onClick={() => handleDelete(product._id)}>
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </button>
                              </>
                            );
                          } else {
                            return (
                              <span className="pm-no-permission">
                                {language === 'ar' ? 'لا توجد صلاحية' : 'No permission'}
                              </span>
                            );
                          }
                        }
                        // أي دور آخر
                        return null;
                      })()}
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
