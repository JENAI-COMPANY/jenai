import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import '../styles/Admin.css';

const SupplierDashboard = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    subscriberPrice: '',
    category: '',
    stock: '',
    commissionRate: '10'
  });

  const managedCategories = user?.managedCategories || [];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      const allProducts = data.products || [];

      // Filter products by managed categories
      const filtered = allProducts.filter(product =>
        managedCategories.includes(product.category)
      );

      setProducts(allProducts);
      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const value = e.target.value;
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [e.target.name]: value });
    } else {
      setNewProduct({ ...newProduct, [e.target.name]: value });
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    // Check if category is allowed
    if (!managedCategories.includes(newProduct.category)) {
      alert(`غير مسموح لك بإضافة منتجات في قسم "${newProduct.category}"`);
      return;
    }

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
      fetchProducts();
      alert('تم إضافة المنتج بنجاح');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('فشل في إضافة المنتج');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    // Check if category is allowed
    if (!managedCategories.includes(editingProduct.category)) {
      alert(`غير مسموح لك بتعديل منتجات في قسم "${editingProduct.category}"`);
      return;
    }

    try {
      await updateProduct(editingProduct._id, editingProduct);
      setEditingProduct(null);
      fetchProducts();
      alert('تم تحديث المنتج بنجاح');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('فشل في تحديث المنتج');
    }
  };

  const handleDeleteProduct = async (id, category) => {
    if (!managedCategories.includes(category)) {
      alert(`غير مسموح لك بحذف منتجات من قسم "${category}"`);
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(id);
        fetchProducts();
        alert('تم حذف المنتج بنجاح');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('فشل في حذف المنتج');
      }
    }
  };

  const handleEditProduct = (product) => {
    if (!managedCategories.includes(product.category)) {
      alert(`غير مسموح لك بتعديل منتجات من قسم "${product.category}"`);
      return;
    }
    setEditingProduct(product);
    setShowProductForm(false);
  };

  return (
    <div className="admin-container">
      <h2>لوحة تحكم المورد - {user?.companyName || user?.name}</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        الأقسام المتاحة: <strong>{managedCategories.join(' - ')}</strong>
      </p>

      <div>
        <div className="tab-header">
          <h3>📦 إدارة المنتجات</h3>
          <button onClick={() => { setShowProductForm(!showProductForm); setEditingProduct(null); }} className="add-btn">
            {showProductForm ? 'إلغاء' : 'إضافة منتج'}
          </button>
        </div>

        {/* Product Form */}
        {(showProductForm || editingProduct) && (
          <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form" autoComplete="off">
            <h4>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>اسم المنتج *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="اسم المنتج"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={handleProductChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>القسم *</label>
                <select
                  name="category"
                  value={editingProduct ? editingProduct.category : newProduct.category}
                  onChange={handleProductChange}
                  required
                >
                  <option value="">اختر القسم</option>
                  {managedCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>سعر الزبون *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="السعر"
                  value={editingProduct ? editingProduct.price : newProduct.price}
                  onChange={handleProductChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>سعر العضو *</label>
                <input
                  type="number"
                  name="subscriberPrice"
                  placeholder="سعر العضو"
                  value={editingProduct ? editingProduct.subscriberPrice : newProduct.subscriberPrice}
                  onChange={handleProductChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>الكمية المتوفرة *</label>
                <input
                  type="number"
                  name="stock"
                  placeholder="الكمية"
                  value={editingProduct ? editingProduct.stock : newProduct.stock}
                  onChange={handleProductChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>نسبة العمولة (%) *</label>
                <input
                  type="number"
                  name="commissionRate"
                  placeholder="نسبة العمولة"
                  value={editingProduct ? editingProduct.commissionRate : newProduct.commissionRate}
                  onChange={handleProductChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>وصف المنتج</label>
              <textarea
                name="description"
                placeholder="وصف المنتج"
                value={editingProduct ? editingProduct.description : newProduct.description}
                onChange={handleProductChange}
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="submit-btn">
                {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </button>
              {editingProduct && (
                <button type="button" className="cancel-btn" onClick={() => setEditingProduct(null)}>
                  إلغاء
                </button>
              )}
            </div>
          </form>
        )}

        {/* Products Table */}
        {loading ? (
          <div>جاري التحميل...</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>القسم</th>
                  <th>سعر الزبون</th>
                  <th>سعر العضو</th>
                  <th>الكمية</th>
                  <th>العمولة %</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id || product._id}>
                    <td>{product.name}</td>
                    <td><span className="badge">{product.category}</span></td>
                    <td>${product.price}</td>
                    <td>${product.subscriberPrice || '-'}</td>
                    <td>{product.stock}</td>
                    <td>{product.commissionRate}%</td>
                    <td>
                      <button onClick={() => handleEditProduct(product)} className="edit-btn">
                        تعديل
                      </button>
                      <button onClick={() => handleDeleteProduct(product._id, product.category)} className="delete-btn">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="no-data">لا توجد منتجات في الأقسام المتاحة لك.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDashboard;
