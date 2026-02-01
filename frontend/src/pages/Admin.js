import React, { useState, useEffect, useContext } from 'react';
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
import '../styles/Admin.css';
import { countryCodes, allCountries } from '../utils/countryCodes';

const Admin = () => {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'super_admin';
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

  // استخدام قائمة الدول من الملف المشترك
  const countries = allCountries;

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
      } else if (activeTab === 'members') {
        const data = await getAllUsers();
        // Filter only members
        const membersOnly = data.users.filter(user => user.role === 'member');
        setMembers(membersOnly);
      } else if (activeTab === 'library') {
        const data = await getBooks();
        setBooks(data.books || []);
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

  return (
    <div className="admin-container">
      <h2>لوحة التحكم</h2>

      <div className="admin-tabs">
        <button
          className={activeTab === 'statistics' ? 'tab-active' : ''}
          onClick={() => setActiveTab('statistics')}
        >
          📊 الإحصائيات
        </button>
        <button
          className={activeTab === 'ranks' ? 'tab-active' : ''}
          onClick={() => setActiveTab('ranks')}
        >
          🏆 الدرجات التسع
        </button>
        <button
          className={activeTab === 'profit' ? 'tab-active' : ''}
          onClick={() => setActiveTab('profit')}
        >
          💰 احتساب الأرباح
        </button>
        <button
          className={activeTab === 'products' ? 'tab-active' : ''}
          onClick={() => setActiveTab('products')}
        >
          المنتجات
        </button>
        <button
          className={activeTab === 'orders' ? 'tab-active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          الطلبات
        </button>
        <button
          className={activeTab === 'subscribers' ? 'tab-active' : ''}
          onClick={() => setActiveTab('subscribers')}
        >
          المشتركين
        </button>
        <button
          className={activeTab === 'members' ? 'tab-active' : ''}
          onClick={() => setActiveTab('members')}
        >
          الأعضاء
        </button>
        {isSuperAdmin && <button
          className={activeTab === 'suppliers' ? 'tab-active' : ''}
          onClick={() => setActiveTab('suppliers')}
        >
          الموردين
        </button>
        }
        <button
          className={activeTab === 'library' ? 'tab-active' : ''}
          onClick={() => setActiveTab('library')}
        >
          📚 المكتبة
        </button>
        <button
          className={activeTab === 'profit-periods' ? 'tab-active' : ''}
          onClick={() => window.location.href = '/profit-periods'}
        >
          💰 فترات الأرباح
        </button>
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
                  {members.map((member) => (
                    <tr key={member._id}>
                      <td>{member.name}</td>
                      <td>{member.username}</td>
                      <td><strong>{member.subscriberCode}</strong></td>
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

          activeTab === "suppliers" && isSuperAdmin && (
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
        </div>
      )}
    </div>
  );
};

export default Admin;
