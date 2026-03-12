import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  getProducts,
  getAllOrders,
  getAllSubscribers,
  createProduct,
  deleteProduct,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  getAllUsers,
  createUser,
  updateUser,
  getBooks,
  createBook,
  updateBook,
  deleteBook
} from '../services/api';
import Statistics from '../components/Statistics';
import MemberRanks from '../components/MemberRanks';
import ProfitCalculation from '../components/ProfitCalculation';
import ReviewManagement from '../components/ReviewManagement';
import StaffManagement from '../components/StaffManagement';
import '../styles/Admin.css';
import { countryCodes, allCountries } from '../utils/countryCodes';
import { getRankImage, getRankName } from '../utils/rankHelpers';

const Admin = () => {
  const { user, isSuperAdmin, isCategoryAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('statistics');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [categoryAdmins, setCategoryAdmins] = useState([]);
  const [showCategoryAdminForm, setShowCategoryAdminForm] = useState(false);
  const [membersSearchTerm, setMembersSearchTerm] = useState('');

  // Academy state
  const [academyVideos, setAcademyVideos] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null);
  const [newVideo, setNewVideo] = useState({
    titleAr: '', title: '', descriptionAr: '', order: 0, videoUrl: '',
    quiz: { questions: [], passingScore: 60 }
  });
  const [newQuestion, setNewQuestion] = useState({ questionAr: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 });
  const [videoFile, setVideoFile] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    subscriberPrice: '',
    category: '',
    stock: '',
    commissionRate: '10'
  });

  const [newSupplier, setNewSupplier] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    phone: '',
    countryCode: '+20',
    country: '',
    city: '',
    address: '',
    taxNumber: '',
    category: 'other',
    paymentTerms: 'cash',
    managedCategories: [],
    notes: ''
  });

  const [productCategories, setProductCategories] = useState([]);

  const [memberEdit, setMemberEdit] = useState({
    sponsorCode: '',
    commissionRate: '',
    isActive: true
  });

  const [newBook, setNewBook] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    author: '',
    authorAr: '',
    category: '',
    categoryAr: '',
    coverImage: '',
    fileUrl: '',
    fileType: 'pdf',
    pages: ''
  });

  const [newMember, setNewMember] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    countryCode: '+20',
    country: '',
    city: '',
    role: 'customer',
    sponsorCode: ''
  });

  const [newCategoryAdmin, setNewCategoryAdmin] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    countryCode: '+970',
    managedCategories: [],
    permissions: {
      canViewProducts: true,
      canManageProducts: true
    }
  });

  // استخدام قائمة الدول من الملف المشترك
  const countries = allCountries;

  // Set default tab based on role or URL param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (user?.role === 'sales_employee') {
      setActiveTab('orders');
    } else if (user?.role === 'admin_secretary') {
      setActiveTab('members');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    fetchData();
    fetchProductCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchProductCategories = async () => {
    try {
      const data = await getProducts();
      const categories = [...new Set(data.products.map(p => p.category).filter(Boolean))];
      setProductCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const data = await getProducts();
        setProducts(data.products);
      } else if (activeTab === 'orders') {
        const data = await getAllOrders();
        setOrders(data.orders);
      } else if (activeTab === 'subscribers') {
        const data = await getAllSubscribers();
        setSubscribers(data.subscribers);
      } else if (activeTab === "suppliers" && isSuperAdmin) {
        const data = await getSuppliers();
        setSuppliers(data.suppliers);
      } else if (activeTab === 'category-admins' && isSuperAdmin) {
        const data = await getAllUsers();
        // Filter only category admins
        const categoryAdminsOnly = data.users.filter(user => user.role === 'category_admin');
        setCategoryAdmins(categoryAdminsOnly);
      } else if (activeTab === 'members') {
        const data = await getAllUsers();
        // Filter only members
        const membersOnly = data.users.filter(user => user.role === 'member');
        setMembers(membersOnly);
      } else if (activeTab === 'library') {
        const data = await getBooks();
        setBooks(data.books || []);
      } else if (activeTab === 'academy' && isSuperAdmin) {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/academy/videos/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAcademyVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleSupplierChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (editingSupplier) {
      setEditingSupplier({ ...editingSupplier, [e.target.name]: value });
    } else {
      setNewSupplier({ ...newSupplier, [e.target.name]: value });
    }
  };

  const handleCategoryToggle = (category) => {
    if (editingSupplier) {
      const categories = editingSupplier.managedCategories || [];
      const updated = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      setEditingSupplier({ ...editingSupplier, managedCategories: updated });
    } else {
      const categories = newSupplier.managedCategories || [];
      const updated = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      setNewSupplier({ ...newSupplier, managedCategories: updated });
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProduct);
      setShowProductForm(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        subscriberPrice: '',
        category: '',
        stock: '',
        commissionRate: '10'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  // Supplier handlers
  const handleCreateSupplier = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newSupplier.password !== newSupplier.confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, countryCode, ...supplierData } = newSupplier;
      // Combine country code and phone
      if (countryCode && newSupplier.phone) {
        supplierData.phone = countryCode + newSupplier.phone;
      }
      await createSupplier(supplierData);
      setShowSupplierForm(false);
      setNewSupplier({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        companyName: '',
        phone: '',
        country: '',
        city: '',
        address: '',
        taxNumber: '',
        category: 'other',
        paymentTerms: 'cash',
        managedCategories: [],
        notes: ''
      });
      fetchData();
      alert('تم إضافة المورد بنجاح');
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert(error.response?.data?.message || 'فشل في إضافة المورد');
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      await updateSupplier(editingSupplier._id, editingSupplier);
      setEditingSupplier(null);
      fetchData();
      alert('تم تحديث بيانات المورد بنجاح');
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('فشل في تحديث بيانات المورد');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      try {
        await deleteSupplier(id);
        fetchData();
        alert('تم حذف المورد بنجاح');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('فشل في حذف المورد');
      }
    }
  };

  const handleToggleSupplierStatus = async (id) => {
    try {
      await toggleSupplierStatus(id);
      fetchData();
    } catch (error) {
      console.error('Error toggling supplier status:', error);
      alert('فشل في تغيير حالة المورد');
    }
  };

  // Member handlers
  const handleEditMember = (member) => {
    setEditingMember(member);
    setMemberEdit({
      sponsorCode: member.sponsorId?.subscriberCode || '',
      commissionRate: member.commissionRate || 10,
      isActive: member.isActive !== false
    });
  };

  const handleMemberEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMemberEdit({ ...memberEdit, [e.target.name]: value });
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    try {
      // Build update data
      const updateData = {
        commissionRate: Number(memberEdit.commissionRate),
        isActive: memberEdit.isActive
      };

      // If sponsor code changed, we need to find the new sponsor
      if (memberEdit.sponsorCode && memberEdit.sponsorCode !== editingMember.sponsorId?.subscriberCode) {
        // The backend will handle finding the sponsor by code
        updateData.newSponsorCode = memberEdit.sponsorCode;
      }

      await updateUser(editingMember._id, updateData);
      setEditingMember(null);
      fetchData();
      alert('تم تحديث بيانات العضو بنجاح');
    } catch (error) {
      console.error('Error updating member:', error);
      alert(error.response?.data?.message || 'فشل في تحديث بيانات العضو');
    }
  };

  const handleMemberChange = (e) => {
    const value = e.target.value;
    setNewMember({ ...newMember, [e.target.name]: value });
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newMember.password !== newMember.confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }

    try {
      const { confirmPassword, countryCode, ...memberData } = newMember;
      // Combine country code and phone
      if (countryCode && newMember.phone) {
        memberData.phone = countryCode + newMember.phone;
      }
      await createUser(memberData);
      setShowMemberForm(false);
      setNewMember({
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
      fetchData();
      alert('تم إضافة المستخدم بنجاح');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'فشل في إضافة المستخدم');
    }
  };

  const supplierCategories = [
    { value: 'electronics', label: 'إلكترونيات' },
    { value: 'clothing', label: 'ملابس' },
    { value: 'food', label: 'مواد غذائية' },
    { value: 'cosmetics', label: 'مستحضرات تجميل' },
    { value: 'home', label: 'أدوات منزلية' },
    { value: 'sports', label: 'رياضة' },
    { value: 'other', label: 'أخرى' }
  ];

  const paymentTermsOptions = [
    { value: 'cash', label: 'نقدي' },
    { value: 'net_15', label: 'صافي 15 يوم' },
    { value: 'net_30', label: 'صافي 30 يوم' },
    { value: 'net_60', label: 'صافي 60 يوم' }
  ];

  // Category Admin handlers
  const handleCategoryAdminChange = (e) => {
    const value = e.target.value;
    setNewCategoryAdmin({ ...newCategoryAdmin, [e.target.name]: value });
  };

  const handleCreateCategoryAdmin = async (e) => {
    e.preventDefault();

    if (newCategoryAdmin.password !== newCategoryAdmin.confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }

    if (newCategoryAdmin.managedCategories.length === 0) {
      alert('يجب اختيار قسم واحد على الأقل');
      return;
    }

    try {
      const { confirmPassword, countryCode, ...adminData } = newCategoryAdmin;
      adminData.phone = countryCode + newCategoryAdmin.phone;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/category-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.messageAr || 'فشل في إنشاء مدير القسم');
      }

      setShowCategoryAdminForm(false);
      setNewCategoryAdmin({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        countryCode: '+970',
        managedCategories: [],
        permissions: { canViewProducts: true, canManageProducts: true }
      });
      fetchData();
      alert('تم إنشاء مدير القسم بنجاح');
    } catch (error) {
      console.error('Error creating category admin:', error);
      alert(error.message || 'فشل في إنشاء مدير القسم');
    }
  };

  const handleDeleteCategoryAdmin = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف مدير القسم؟')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      alert('تم حذف مدير القسم بنجاح');
    } catch (error) {
      console.error('Error deleting category admin:', error);
      alert('فشل في حذف مدير القسم');
    }
  };

  // Book handlers
  const handleBookChange = (e) => {
    const value = e.target.value;
    if (editingBook) {
      setEditingBook({ ...editingBook, [e.target.name]: value });
    } else {
      setNewBook({ ...newBook, [e.target.name]: value });
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await createBook(newBook);
      setShowBookForm(false);
      setNewBook({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        author: '',
        authorAr: '',
        category: '',
        categoryAr: '',
        coverImage: '',
        fileUrl: '',
        fileType: 'pdf',
        pages: ''
      });
      fetchData();
      alert('تم إضافة الكتاب بنجاح');
    } catch (error) {
      console.error('Error creating book:', error);
      alert('فشل في إضافة الكتاب');
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      await updateBook(editingBook._id, editingBook);
      setEditingBook(null);
      fetchData();
      alert('تم تحديث الكتاب بنجاح');
    } catch (error) {
      console.error('Error updating book:', error);
      alert('فشل في تحديث الكتاب');
    }
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
      try {
        await deleteBook(id);
        fetchData();
        alert('تم حذف الكتاب بنجاح');
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('فشل في حذف الكتاب');
      }
    }
  };

  // ===== Academy Handlers =====
  const getAcademyToken = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    const videoData = editingVideo || newVideo;
    try {
      if (editingVideo) {
        await axios.put(`/api/academy/videos/${editingVideo._id}`, videoData, { headers: getAcademyToken() });
      } else {
        const res = await axios.post('/api/academy/videos', videoData, { headers: getAcademyToken() });
        // Upload file if selected for new video
        if (videoFile && res.data.video?._id) {
          const formData = new FormData();
          formData.append('video', videoFile);
          await axios.post(`/api/academy/videos/${res.data.video._id}/upload`, formData, {
            headers: { ...getAcademyToken(), 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      setShowVideoForm(false);
      setEditingVideo(null);
      setNewVideo({ titleAr: '', title: '', descriptionAr: '', order: 0, videoUrl: '', quiz: { questions: [], passingScore: 60 } });
      setVideoFile(null);
      fetchData();
      alert('تم الحفظ بنجاح');
    } catch (error) {
      alert('فشل في الحفظ: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUploadVideo = async (videoId) => {
    if (!videoFile) return;
    const formData = new FormData();
    formData.append('video', videoFile);
    setVideoUploading(true);
    setVideoUploadProgress('جاري الرفع...');
    try {
      await axios.post(`/api/academy/videos/${videoId}/upload`, formData, {
        headers: { ...getAcademyToken(), 'Content-Type': 'multipart/form-data' }
      });
      setVideoFile(null);
      setVideoUploadProgress(null);
      fetchData();
      alert('تم رفع الفيديو بنجاح');
    } catch (error) {
      alert('فشل رفع الفيديو: ' + (error.response?.data?.message || error.message));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      try {
        await axios.delete(`/api/academy/videos/${id}`, { headers: getAcademyToken() });
        fetchData();
      } catch (error) {
        alert('فشل في الحذف');
      }
    }
  };

  const handleAddQuestion = (videoData, setVideoData) => {
    const q = { ...newQuestion, options: newQuestion.type === 'truefalse' ? [] : [...newQuestion.options] };
    setVideoData({ ...videoData, quiz: { ...videoData.quiz, questions: [...(videoData.quiz?.questions || []), q] } });
    setNewQuestion({ questionAr: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const handleRemoveQuestion = (index, videoData, setVideoData) => {
    const questions = [...(videoData.quiz?.questions || [])];
    questions.splice(index, 1);
    setVideoData({ ...videoData, quiz: { ...videoData.quiz, questions } });
  };

  return (
    <div className="admin-container">
      <div className="admin-tabs">
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'statistics' ? 'tab-active' : ''}
            onClick={() => setActiveTab('statistics')}
          >
            📊 الإحصائيات
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'ranks' ? 'tab-active' : ''}
            onClick={() => setActiveTab('ranks')}
          >
            🏆 الدرجات التسع
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'profit' ? 'tab-active' : ''}
            onClick={() => setActiveTab('profit')}
          >
            💰 احتساب الأرباح
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'products' ? 'tab-active' : ''}
            onClick={() => setActiveTab('products')}
          >
            المنتجات
          </button>
        )}
        {user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'orders' ? 'tab-active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            الطلبات
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'subscribers' ? 'tab-active' : ''}
            onClick={() => setActiveTab('subscribers')}
          >
            المشتركين
          </button>
        )}
        {user?.role !== 'sales_employee' && (
          <button
            className={activeTab === 'members' ? 'tab-active' : ''}
            onClick={() => setActiveTab('members')}
          >
            الأعضاء
          </button>
        )}
        {isSuperAdmin && <button
          className={activeTab === 'suppliers' ? 'tab-active' : ''}
          onClick={() => setActiveTab('suppliers')}
        >
          الموردين
        </button>
        }
        {isSuperAdmin && <button
          className={activeTab === 'category-admins' ? 'tab-active' : ''}
          onClick={() => setActiveTab('category-admins')}
        >
          مدراء الأقسام
        </button>
        }
        {isSuperAdmin && <button
          className={activeTab === 'category-permissions' ? 'tab-active' : ''}
          onClick={() => setActiveTab('category-permissions')}
        >
          🔒 صلاحيات مدراء الأقسام
        </button>
        }
        {isSuperAdmin && <button
          className={activeTab === 'staff' ? 'tab-active' : ''}
          onClick={() => setActiveTab('staff')}
        >
          👥 الموظفون
        </button>
        }
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'library' ? 'tab-active' : ''}
            onClick={() => setActiveTab('library')}
          >
            📚 المكتبة
          </button>
        )}
        {isSuperAdmin && (
          <button
            className={activeTab === 'academy' ? 'tab-active' : ''}
            onClick={() => setActiveTab('academy')}
          >
            🎓 الأكاديمية
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'reviews' ? 'tab-active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            ⭐ التقييمات
          </button>
        )}
        {user?.role !== 'sales_employee' && user?.role !== 'admin_secretary' && (
          <button
            className={activeTab === 'profit-periods' ? 'tab-active' : ''}
            onClick={() => window.location.href = '/profit-periods'}
          >
            💰 فترات الأرباح
          </button>
        )}
      </div>

      {loading && activeTab !== 'statistics' ? (
        <div className="loading">جاري التحميل...</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'statistics' && (
            <Statistics />
          )}

          {activeTab === 'ranks' && (
            <MemberRanks />
          )}

          {activeTab === 'profit' && (
            <ProfitCalculation />
          )}

          {activeTab === 'reviews' && (
            <ReviewManagement />
          )}

          {activeTab === 'products' && (
            <div>
              <div className="tab-header">
                <h3>إدارة المنتجات</h3>
                <button onClick={() => setShowProductForm(!showProductForm)} className="add-btn">
                  {showProductForm ? 'إلغاء' : 'إضافة منتج'}
                </button>
              </div>

              {showProductForm && (
                <form onSubmit={handleCreateProduct} className="product-form" autoComplete="off">
                  <div className="form-grid">
                    <input
                      type="text"
                      name="name"
                      placeholder="اسم المنتج"
                      value={newProduct.name}
                      onChange={handleProductChange}
                      required
                    />
                    <input
                      type="text"
                      name="category"
                      placeholder="الفئة"
                      value={newProduct.category}
                      onChange={handleProductChange}
                      required
                    />
                    <input
                      type="number"
                      name="price"
                      placeholder="السعر العادي"
                      value={newProduct.price}
                      onChange={handleProductChange}
                      required
                    />
                    <input
                      type="number"
                      name="subscriberPrice"
                      placeholder="سعر العضو"
                      value={newProduct.subscriberPrice}
                      onChange={handleProductChange}
                      required
                    />
                    <input
                      type="number"
                      name="stock"
                      placeholder="المخزون"
                      value={newProduct.stock}
                      onChange={handleProductChange}
                      required
                    />
                    <input
                      type="number"
                      name="commissionRate"
                      placeholder="نسبة العمولة (%)"
                      value={newProduct.commissionRate}
                      onChange={handleProductChange}
                      required
                    />
                  </div>
                  <textarea
                    name="description"
                    placeholder="وصف المنتج"
                    value={newProduct.description}
                    onChange={handleProductChange}
                    required
                  />
                  <button type="submit" className="submit-btn">إنشاء المنتج</button>
                </form>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الفئة</th>
                    <th>السعر</th>
                    <th>سعر العضو</th>
                    <th>المخزون</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id || product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${product.price}</td>
                      <td>${product.subscriberPrice}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`status ${product.isActive ? 'active' : 'inactive'}`}>
                          {product.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteProduct(product._id)} className="delete-btn">
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3>إدارة الطلبات</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>المجموع</th>
                    <th>الحالة</th>
                    <th>الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id.substring(0, 8)}...</td>
                      <td>{order.user?.name}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td>${order.totalPrice}</td>
                      <td>
                        <span className={`status ${order.status}`}>{order.status}</span>
                      </td>
                      <td>
                        <span className={`status ${order.isPaid ? 'active' : 'inactive'}`}>
                          {order.isPaid ? 'مدفوع' : 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div>
              <h3>إدارة المشتركين</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد</th>
                    <th>رقم المشترك</th>
                    <th>الراعي</th>
                    <th>نسبة العمولة</th>
                    <th>إجمالي العمولة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id}>
                      <td>{subscriber.name}</td>
                      <td>{subscriber.email}</td>
                      <td>{subscriber.subscriberId}</td>
                      <td>{subscriber.sponsorId?.name || 'لا يوجد'}</td>
                      <td>{subscriber.commissionRate}%</td>
                      <td>${(subscriber.totalCommission || 0).toFixed(2)}</td>
                      <td>
                        <span className={`status ${subscriber.isActive ? 'active' : 'inactive'}`}>
                          {subscriber.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div className="tab-header">
                <h3>إدارة الأعضاء</h3>
                <button onClick={() => setShowMemberForm(!showMemberForm)} className="add-btn">
                  {showMemberForm ? 'إلغاء' : 'إضافة مستخدم'}
                </button>
              </div>

              {/* Search Field */}
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="بحث بالاسم، اسم المستخدم أو كود العضو..."
                  value={membersSearchTerm}
                  onChange={(e) => setMembersSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Member Creation Form */}
              {showMemberForm && (
                <form onSubmit={handleCreateMember} className="product-form" autoComplete="off">
                  <h4>إضافة مستخدم جديد</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>اسم المستخدم *</label>
                      <input
                        type="text"
                        name="username"
                        placeholder="اسم المستخدم"
                        value={newMember.username}
                        onChange={handleMemberChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>الاسم الكامل *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="الاسم الكامل"
                        value={newMember.name}
                        onChange={handleMemberChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>كلمة المرور *</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="كلمة المرور"
                        value={newMember.password}
                        onChange={handleMemberChange}
                        minLength="6"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>تأكيد كلمة المرور *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="تأكيد كلمة المرور"
                        value={newMember.confirmPassword}
                        onChange={handleMemberChange}
                        minLength="6"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>رقم الهاتف</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                          name="countryCode"
                          value={newMember.countryCode}
                          onChange={handleMemberChange}
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
                          name="phone"
                          placeholder="رقم الهاتف"
                          value={newMember.phone}
                          onChange={handleMemberChange}
                          style={{ flex: '1' }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>الدولة</label>
                      <select
                        name="country"
                        value={newMember.country}
                        onChange={handleMemberChange}
                      >
                        <option value="">اختر الدولة</option>
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>المدينة</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="المدينة"
                        value={newMember.city}
                        onChange={handleMemberChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>نوع المستخدم *</label>
                      <select
                        name="role"
                        value={newMember.role}
                        onChange={handleMemberChange}
                        required
                      >
                        <option value="customer">زبون (Customer)</option>
                        <option value="member">عضو (Member)</option>
                        <option value="supplier">مورد (Supplier)</option>
                      </select>
                    </div>
                    {newMember.role === 'member' && (
                      <div className="form-group">
                        <label>كود الراعي (اختياري)</label>
                        <input
                          type="text"
                          name="sponsorCode"
                          placeholder="كود الراعي"
                          value={newMember.sponsorCode}
                          onChange={handleMemberChange}
                        />
                        <small>أدخل كود الراعي لربط العضو بشجرة العمولات</small>
                      </div>
                    )}
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-btn">إضافة المستخدم</button>
                    <button type="button" className="cancel-btn" onClick={() => setShowMemberForm(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Member Edit Modal */}
              {editingMember && (
                <div className="modal-overlay" onClick={() => setEditingMember(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3>تعديل بيانات العضو: {editingMember.name}</h3>
                    <form onSubmit={handleUpdateMember} autoComplete="off">
                      <div className="form-group">
                        <label>كود الراعي (Sponsor Code)</label>
                        <input
                          type="text"
                          name="sponsorCode"
                          value={memberEdit.sponsorCode}
                          onChange={handleMemberEditChange}
                          placeholder="أدخل كود الراعي الجديد"
                        />
                        <small>الراعي الحالي: {editingMember.sponsorId?.name || 'لا يوجد'} ({editingMember.sponsorId?.subscriberCode || '-'})</small>
                      </div>
                      <div className="form-group">
                        <label>نسبة العمولة (%)</label>
                        <input
                          type="number"
                          name="commissionRate"
                          value={memberEdit.commissionRate}
                          onChange={handleMemberEditChange}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={memberEdit.isActive}
                            onChange={handleMemberEditChange}
                          />
                          نشط
                        </label>
                      </div>
                      <div className="modal-buttons">
                        <button type="submit" className="submit-btn">حفظ التغييرات</button>
                        <button type="button" className="cancel-btn" onClick={() => setEditingMember(null)}>إلغاء</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>اسم المستخدم</th>
                    <th>كود العضو</th>
                    <th>الرتبة</th>
                    <th>الدولة</th>
                    <th>المدينة</th>
                    <th>الراعي</th>
                    <th>كود الراعي</th>
                    <th>نسبة العمولة</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .filter(member => {
                      const searchLower = membersSearchTerm.toLowerCase();
                      return member.name.toLowerCase().includes(searchLower) ||
                             member.username.toLowerCase().includes(searchLower) ||
                             (member.subscriberCode || '').toLowerCase().includes(searchLower);
                    })
                    .map((member) => (
                    <tr key={member._id}>
                      <td>{member.name}</td>
                      <td>{member.username}</td>
                      <td><strong>{member.subscriberCode}</strong></td>
                      <td>
                        {member.memberRank ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <img
                              src={`/${getRankImage(member.memberRank)}`}
                              alt={getRankName(member.memberRank, 'ar')}
                              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#555' }}>
                              {getRankName(member.memberRank, 'ar')}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td>{member.country || '-'}</td>
                      <td>{member.city || '-'}</td>
                      <td>{member.sponsorId?.name || 'لا يوجد'}</td>
                      <td>{member.sponsorId?.subscriberCode || '-'}</td>
                      <td>{member.commissionRate}%</td>
                      <td>
                        <span className={`status ${member.isActive !== false ? 'active' : 'inactive'}`}>
                          {member.isActive !== false ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditMember(member)} className="edit-btn">
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "suppliers" && isSuperAdmin && (
            <div>
              <div className="tab-header">
                <h3>إدارة الموردين</h3>
                <button onClick={() => { setShowSupplierForm(!showSupplierForm); setEditingSupplier(null); }} className="add-btn">
                  {showSupplierForm ? 'إلغاء' : 'إضافة مورد'}
                </button>
              </div>

              {/* Supplier Form (Add/Edit) */}
              {(showSupplierForm || editingSupplier) && (
                <form onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier} className="product-form supplier-form" autoComplete="off">
                  <h4>{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h4>
                  <div className="form-grid">
                    {!editingSupplier && (
                      <>
                        <div className="form-group">
                          <label>اسم المستخدم *</label>
                          <input
                            type="text"
                            name="username"
                            placeholder="اسم المستخدم للدخول"
                            value={newSupplier.username}
                            onChange={handleSupplierChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>كلمة المرور *</label>
                          <input
                            type="password"
                            name="password"
                            placeholder="كلمة المرور"
                            value={newSupplier.password}
                            onChange={handleSupplierChange}
                            minLength="6"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>تأكيد كلمة المرور *</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            placeholder="تأكيد كلمة المرور"
                            value={newSupplier.confirmPassword}
                            onChange={handleSupplierChange}
                            minLength="6"
                            required
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group">
                      <label>اسم المورد *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="اسم المورد"
                        value={editingSupplier ? editingSupplier.name : newSupplier.name}
                        onChange={handleSupplierChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>اسم الشركة *</label>
                      <input
                        type="text"
                        name="companyName"
                        placeholder="اسم الشركة"
                        value={editingSupplier ? editingSupplier.companyName : newSupplier.companyName}
                        onChange={handleSupplierChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>رقم الهاتف *</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                          name="countryCode"
                          value={editingSupplier ? (editingSupplier.countryCode || '+20') : newSupplier.countryCode}
                          onChange={handleSupplierChange}
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
                          name="phone"
                          placeholder="رقم الهاتف"
                          value={editingSupplier ? editingSupplier.phone : newSupplier.phone}
                          onChange={handleSupplierChange}
                          required
                          style={{ flex: '1' }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>الدولة *</label>
                      <select
                        name="country"
                        value={editingSupplier ? editingSupplier.country : newSupplier.country}
                        onChange={handleSupplierChange}
                        required
                      >
                        <option value="">اختر الدولة</option>
                        {countries.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>المدينة *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="المدينة"
                        value={editingSupplier ? editingSupplier.city : newSupplier.city}
                        onChange={handleSupplierChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>العنوان</label>
                      <input
                        type="text"
                        name="address"
                        placeholder="العنوان"
                        value={editingSupplier ? editingSupplier.address : newSupplier.address}
                        onChange={handleSupplierChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>الرقم الضريبي</label>
                      <input
                        type="text"
                        name="taxNumber"
                        placeholder="الرقم الضريبي"
                        value={editingSupplier ? editingSupplier.taxNumber : newSupplier.taxNumber}
                        onChange={handleSupplierChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>التصنيف</label>
                      <select
                        name="category"
                        value={editingSupplier ? editingSupplier.category : newSupplier.category}
                        onChange={handleSupplierChange}
                      >
                        {supplierCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>شروط الدفع</label>
                      <select
                        name="paymentTerms"
                        value={editingSupplier ? editingSupplier.paymentTerms : newSupplier.paymentTerms}
                        onChange={handleSupplierChange}
                      >
                        {paymentTermsOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>أقسام المنتجات المسموح بإدارتها *</label>
                    <div className="categories-checkboxes">
                      {productCategories.length > 0 ? (
                        productCategories.map((category) => (
                          <label key={category} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={(editingSupplier ? editingSupplier.managedCategories : newSupplier.managedCategories || []).includes(category)}
                              onChange={() => handleCategoryToggle(category)}
                            />
                            <span>{category}</span>
                          </label>
                        ))
                      ) : (
                        <p style={{ color: '#999' }}>لا توجد أقسام متاحة. قم بإضافة منتجات أولاً.</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>ملاحظات</label>
                    <textarea
                      name="notes"
                      placeholder="ملاحظات إضافية"
                      value={editingSupplier ? editingSupplier.notes : newSupplier.notes}
                      onChange={handleSupplierChange}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-btn">
                      {editingSupplier ? 'حفظ التغييرات' : 'إضافة المورد'}
                    </button>
                    {editingSupplier && (
                      <button type="button" className="cancel-btn" onClick={() => setEditingSupplier(null)}>
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>كود المورد</th>
                    <th>الاسم</th>
                    <th>الشركة</th>
                    <th>الهاتف</th>
                    <th>الدولة</th>
                    <th>المدينة</th>
                    <th>التصنيف</th>
                    <th>التقييم</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
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
                      <td>{'⭐'.repeat(supplier.rating || 5)}</td>
                      <td>
                        <span className={`status ${supplier.isActive ? 'active' : 'inactive'}`}>
                          {supplier.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button onClick={() => { setEditingSupplier(supplier); setShowSupplierForm(false); }} className="edit-btn">
                          تعديل
                        </button>
                        <button onClick={() => handleToggleSupplierStatus(supplier._id)} className="view-btn">
                          {supplier.isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => handleDeleteSupplier(supplier._id)} className="delete-btn">
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && (
                <div className="no-data">لا يوجد موردين حالياً. قم بإضافة مورد جديد.</div>
              )}
            </div>
          )}

          {activeTab === 'category-admins' && isSuperAdmin && (
            <div>
              <div className="tab-header">
                <h3>إدارة مدراء الأقسام</h3>
                <button onClick={() => setShowCategoryAdminForm(!showCategoryAdminForm)} className="add-btn">
                  {showCategoryAdminForm ? 'إلغاء' : 'إضافة مدير قسم'}
                </button>
              </div>

              {showCategoryAdminForm && (
                <form onSubmit={handleCreateCategoryAdmin} className="admin-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>اسم المستخدم *</label>
                      <input
                        type="text"
                        name="username"
                        value={newCategoryAdmin.username}
                        onChange={handleCategoryAdminChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>الاسم الكامل *</label>
                      <input
                        type="text"
                        name="name"
                        value={newCategoryAdmin.name}
                        onChange={handleCategoryAdminChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>كلمة المرور *</label>
                      <input
                        type="password"
                        name="password"
                        value={newCategoryAdmin.password}
                        onChange={handleCategoryAdminChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>تأكيد كلمة المرور *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={newCategoryAdmin.confirmPassword}
                        onChange={handleCategoryAdminChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>رقم الهاتف</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                          name="countryCode"
                          value={newCategoryAdmin.countryCode}
                          onChange={handleCategoryAdminChange}
                          style={{ width: '100px' }}
                        >
                          {countryCodes.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          name="phone"
                          value={newCategoryAdmin.phone}
                          onChange={handleCategoryAdminChange}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>الأقسام المسؤول عنها *</label>
                    <div className="categories-checkboxes">
                      {productCategories.length > 0 ? (
                        productCategories.map((category) => (
                          <label key={category} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={newCategoryAdmin.managedCategories.includes(category)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewCategoryAdmin(prev => ({
                                  ...prev,
                                  managedCategories: checked
                                    ? [...prev.managedCategories, category]
                                    : prev.managedCategories.filter(c => c !== category)
                                }));
                              }}
                            />
                            <span>{category}</span>
                          </label>
                        ))
                      ) : (
                        <p style={{ color: '#999' }}>لا توجد أقسام متاحة. قم بإضافة منتجات أولاً.</p>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn">إنشاء مدير القسم</button>
                    <button type="button" onClick={() => setShowCategoryAdminForm(false)} className="cancel-btn">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>اسم المستخدم</th>
                      <th>الأقسام المسؤول عنها</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryAdmins.map(admin => (
                      <tr key={admin._id}>
                        <td>{admin.name}</td>
                        <td>{admin.username}</td>
                        <td>
                          {admin.managedCategories && admin.managedCategories.length > 0
                            ? admin.managedCategories.join(', ')
                            : 'لا يوجد'}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteCategoryAdmin(admin._id)}
                            className="delete-btn"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {categoryAdmins.length === 0 && (
                  <div className="no-data">لا يوجد مدراء أقسام حالياً. قم بإضافة مدير قسم جديد.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div>
              <div className="tab-header">
                <h3>📚 إدارة المكتبة</h3>
                <button onClick={() => { setShowBookForm(!showBookForm); setEditingBook(null); }} className="add-btn">
                  {showBookForm ? 'إلغاء' : 'إضافة كتاب'}
                </button>
              </div>

              {/* Book Form (Add/Edit) */}
              {(showBookForm || editingBook) && (
                <form onSubmit={editingBook ? handleUpdateBook : handleCreateBook} className="product-form" autoComplete="off">
                  <h4>{editingBook ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>العنوان (English) *</label>
                      <input
                        type="text"
                        name="title"
                        placeholder="Book Title"
                        value={editingBook ? editingBook.title : newBook.title}
                        onChange={handleBookChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>العنوان (عربي) *</label>
                      <input
                        type="text"
                        name="titleAr"
                        placeholder="عنوان الكتاب"
                        value={editingBook ? editingBook.titleAr : newBook.titleAr}
                        onChange={handleBookChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>المؤلف (English)</label>
                      <input
                        type="text"
                        name="author"
                        placeholder="Author Name"
                        value={editingBook ? editingBook.author : newBook.author}
                        onChange={handleBookChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>المؤلف (عربي)</label>
                      <input
                        type="text"
                        name="authorAr"
                        placeholder="اسم المؤلف"
                        value={editingBook ? editingBook.authorAr : newBook.authorAr}
                        onChange={handleBookChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>القسم (English)</label>
                      <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={editingBook ? editingBook.category : newBook.category}
                        onChange={handleBookChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>القسم (عربي)</label>
                      <input
                        type="text"
                        name="categoryAr"
                        placeholder="القسم"
                        value={editingBook ? editingBook.categoryAr : newBook.categoryAr}
                        onChange={handleBookChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>رابط الغلاف</label>
                      <input
                        type="url"
                        name="coverImage"
                        placeholder="https://..."
                        value={editingBook ? editingBook.coverImage : newBook.coverImage}
                        onChange={handleBookChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>رابط الملف *</label>
                      <input
                        type="url"
                        name="fileUrl"
                        placeholder="https://..."
                        value={editingBook ? editingBook.fileUrl : newBook.fileUrl}
                        onChange={handleBookChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>نوع الملف</label>
                      <select
                        name="fileType"
                        value={editingBook ? editingBook.fileType : newBook.fileType}
                        onChange={handleBookChange}
                      >
                        <option value="pdf">PDF</option>
                        <option value="epub">EPUB</option>
                        <option value="doc">DOC</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>عدد الصفحات</label>
                      <input
                        type="number"
                        name="pages"
                        placeholder="عدد الصفحات"
                        value={editingBook ? editingBook.pages : newBook.pages}
                        onChange={handleBookChange}
                      />
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>الوصف (English)</label>
                    <textarea
                      name="description"
                      placeholder="Book description"
                      value={editingBook ? editingBook.description : newBook.description}
                      onChange={handleBookChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>الوصف (عربي)</label>
                    <textarea
                      name="descriptionAr"
                      placeholder="وصف الكتاب"
                      value={editingBook ? editingBook.descriptionAr : newBook.descriptionAr}
                      onChange={handleBookChange}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-btn">
                      {editingBook ? 'حفظ التغييرات' : 'إضافة الكتاب'}
                    </button>
                    {editingBook && (
                      <button type="button" className="cancel-btn" onClick={() => setEditingBook(null)}>
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>الغلاف</th>
                    <th>العنوان</th>
                    <th>المؤلف</th>
                    <th>القسم</th>
                    <th>النوع</th>
                    <th>الصفحات</th>
                    <th>التحميلات</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book._id}>
                      <td>
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.titleAr} style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>📖</span>
                        )}
                      </td>
                      <td>
                        <strong>{book.titleAr}</strong>
                        <br />
                        <small style={{ color: '#888' }}>{book.title}</small>
                      </td>
                      <td>{book.authorAr || book.author || '-'}</td>
                      <td>{book.categoryAr || book.category || '-'}</td>
                      <td><span className="badge">{book.fileType?.toUpperCase() || 'PDF'}</span></td>
                      <td>{book.pages || '-'}</td>
                      <td>{book.downloadCount || 0}</td>
                      <td className="action-buttons">
                        <button onClick={() => { setEditingBook(book); setShowBookForm(false); }} className="edit-btn">
                          تعديل
                        </button>
                        <button onClick={() => window.open(book.fileUrl, '_blank')} className="view-btn">
                          عرض
                        </button>
                        <button onClick={() => handleDeleteBook(book._id)} className="delete-btn">
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {books.length === 0 && (
                <div className="no-data">لا توجد كتب حالياً. قم بإضافة كتاب جديد.</div>
              )}
            </div>
          )}

          {activeTab === 'staff' && isSuperAdmin && (
            <div>
              <StaffManagement />
            </div>
          )}

          {activeTab === 'academy' && isSuperAdmin && (
            <div>
              <div className="tab-header">
                <h3>🎓 إدارة الأكاديمية</h3>
                <button onClick={() => { setShowVideoForm(!showVideoForm); setEditingVideo(null); setNewVideo({ titleAr: '', title: '', descriptionAr: '', order: academyVideos.length, quiz: { questions: [], passingScore: 60 } }); }} className="add-btn">
                  {showVideoForm ? 'إلغاء' : '+ إضافة فيديو'}
                </button>
              </div>

              {/* نموذج إضافة/تعديل فيديو */}
              {(showVideoForm || editingVideo) && (() => {
                const videoData = editingVideo || newVideo;
                const setVideoData = editingVideo ? setEditingVideo : setNewVideo;
                return (
                  <form onSubmit={handleSaveVideo} className="product-form" style={{ marginBottom: '2rem' }}>
                    <h4>{editingVideo ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}</h4>

                    <div className="form-row">
                      <div className="form-group">
                        <label>العنوان (عربي) *</label>
                        <input required value={videoData.titleAr} onChange={e => setVideoData({ ...videoData, titleAr: e.target.value })} placeholder="عنوان الفيديو بالعربي" />
                      </div>
                      <div className="form-group">
                        <label>العنوان (إنجليزي)</label>
                        <input value={videoData.title} onChange={e => setVideoData({ ...videoData, title: e.target.value })} placeholder="Video title in English" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>الوصف (اختياري)</label>
                      <textarea value={videoData.descriptionAr} onChange={e => setVideoData({ ...videoData, descriptionAr: e.target.value })} placeholder="وصف الفيديو" rows="2" />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>الترتيب</label>
                        <input type="number" value={videoData.order} onChange={e => setVideoData({ ...videoData, order: Number(e.target.value) })} min="0" />
                      </div>
                      <div className="form-group">
                        <label>درجة النجاح في الامتحان (%)</label>
                        <input type="number" value={videoData.quiz?.passingScore || 60} onChange={e => setVideoData({ ...videoData, quiz: { ...videoData.quiz, passingScore: Number(e.target.value) } })} min="0" max="100" />
                      </div>
                    </div>

                    {/* رابط الفيديو أو رفع ملف */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                      <p style={{ fontWeight: 600, color: '#15803d', marginBottom: '0.75rem' }}>🎬 رابط الفيديو أو رفع ملف</p>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>رابط الفيديو (URL)</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={videoData.videoUrl || ''}
                          onChange={e => setVideoData({ ...videoData, videoUrl: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>رفع ملف فيديو (MP4, WebM...)</label>
                        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'block' }} />
                        {editingVideo && videoFile && (
                          <button type="button" className="edit-btn" style={{ marginTop: '0.5rem' }} disabled={videoUploading} onClick={() => handleUploadVideo(editingVideo._id)}>
                            {videoUploading ? (videoUploadProgress || 'جاري الرفع...') : 'رفع الآن'}
                          </button>
                        )}
                        {!editingVideo && videoFile && <small style={{ color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>✓ {videoFile.name} — سيتم الرفع عند الحفظ</small>}
                        {editingVideo?.videoUrl && <small style={{ color: '#888', display: 'block', marginTop: '0.25rem' }}>الملف الحالي: {editingVideo.videoUrl}</small>}
                      </div>
                    </div>

                    {/* إضافة الأسئلة */}
                    <div style={{ marginTop: '1rem', background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                      <h5 style={{ marginBottom: '0.75rem', color: '#22513e' }}>📝 أسئلة الامتحان</h5>

                      {/* الأسئلة الحالية */}
                      {(videoData.quiz?.questions || []).map((q, qi) => (
                        <div key={qi} style={{ background: 'white', border: '1px solid #eee', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong>{qi + 1}. {q.questionAr}</strong>
                            <span style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: '#888' }}>({q.type === 'mcq' ? 'اختيار متعدد' : 'صح/خطأ'})</span>
                            <br />
                            {q.type === 'mcq' && q.options.map((opt, oi) => (
                              <small key={oi} style={{ color: oi === q.correctAnswer ? '#22513e' : '#666', fontWeight: oi === q.correctAnswer ? '700' : 'normal', display: 'inline-block', marginLeft: '0.5rem' }}>
                                {oi === q.correctAnswer ? '✓' : '○'} {opt}
                              </small>
                            ))}
                            {q.type === 'truefalse' && (
                              <small style={{ color: '#666' }}>{q.correctAnswer === 0 ? '✓ صح' : '✓ خطأ'}</small>
                            )}
                          </div>
                          <button type="button" className="delete-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveQuestion(qi, videoData, setVideoData)}>حذف</button>
                        </div>
                      ))}

                      {/* نموذج إضافة سؤال */}
                      <div style={{ background: '#eef7f2', borderRadius: '6px', padding: '0.75rem', marginTop: '0.5rem' }}>
                        <div className="form-row">
                          <div className="form-group" style={{ flex: 2 }}>
                            <label>نص السؤال *</label>
                            <input value={newQuestion.questionAr} onChange={e => setNewQuestion({ ...newQuestion, questionAr: e.target.value })} placeholder="نص السؤال بالعربي" />
                          </div>
                          <div className="form-group">
                            <label>النوع</label>
                            <select value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value, correctAnswer: 0 })}>
                              <option value="mcq">اختيار متعدد</option>
                              <option value="truefalse">صح / خطأ</option>
                            </select>
                          </div>
                        </div>

                        {newQuestion.type === 'mcq' && (
                          <div>
                            <div className="form-row">
                              {newQuestion.options.map((opt, oi) => (
                                <div key={oi} className="form-group">
                                  <label>الخيار {oi + 1}</label>
                                  <input value={opt} onChange={e => { const opts = [...newQuestion.options]; opts[oi] = e.target.value; setNewQuestion({ ...newQuestion, options: opts }); }} placeholder={`الخيار ${oi + 1}`} />
                                </div>
                              ))}
                            </div>
                            <div className="form-group">
                              <label>الإجابة الصحيحة</label>
                              <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}>
                                {newQuestion.options.map((opt, oi) => (
                                  <option key={oi} value={oi}>{opt || `الخيار ${oi + 1}`}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {newQuestion.type === 'truefalse' && (
                          <div className="form-group">
                            <label>الإجابة الصحيحة</label>
                            <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}>
                              <option value={0}>صح</option>
                              <option value={1}>خطأ</option>
                            </select>
                          </div>
                        )}

                        <button type="button" className="edit-btn" onClick={() => handleAddQuestion(videoData, setVideoData)} disabled={!newQuestion.questionAr.trim()}>
                          + إضافة السؤال
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button type="submit" className="add-btn">{editingVideo ? 'حفظ التعديلات' : 'إنشاء الفيديو'}</button>
                      <button type="button" className="delete-btn" onClick={() => { setShowVideoForm(false); setEditingVideo(null); }}>إلغاء</button>
                    </div>
                  </form>
                );
              })()}

              {/* جدول الفيديوهات */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العنوان</th>
                    <th>الترتيب</th>
                    <th>الأسئلة</th>
                    <th>درجة النجاح</th>
                    <th>فيديو</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {academyVideos.map((video, idx) => (
                    <tr key={video._id}>
                      <td>{idx + 1}</td>
                      <td><strong>{video.titleAr}</strong><br /><small style={{ color: '#888' }}>{video.title}</small></td>
                      <td>{video.order}</td>
                      <td>{video.quiz?.questions?.length || 0} سؤال</td>
                      <td>{video.quiz?.passingScore || 60}%</td>
                      <td>{video.videoUrl ? <span style={{ color: '#22513e' }}>✅ مرفوع</span> : <span style={{ color: '#dc3545' }}>❌ لا يوجد</span>}</td>
                      <td className="action-buttons">
                        <button onClick={() => { setEditingVideo({ ...video }); setShowVideoForm(false); }} className="edit-btn">تعديل</button>
                        <button onClick={() => handleDeleteVideo(video._id)} className="delete-btn">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {academyVideos.length === 0 && (
                <div className="no-data">لا توجد فيديوهات حالياً. قم بإضافة فيديو جديد.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
