import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import '../styles/CreateOrderForUser.css';

const CreateOrderForUser = ({ product, onClose, onSuccess }) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('pay_at_company');
  const [shippingAddress, setShippingAddress] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 1) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/admin/search-users?search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Search response:', response.data);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.name);
    setSearchResults([]);

    // Pre-fill delivery info from user data
    setCity(user.city || '');
    setDeliveryPhone(user.phone || '');
    setShippingAddress(user.address || '');

    // Parse address if available
    if (user.address) {
      const addressParts = user.address.split(',').map(s => s.trim());
      if (addressParts.length > 0) setStreet(addressParts[0]);
      if (addressParts.length > 1) setArea(addressParts[1]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      alert(language === 'ar' ? 'يرجى اختيار عضو أو زبون' : 'Please select a member or customer');
      return;
    }

    // Validate delivery info if delivery method is selected
    if (deliveryMethod === 'delivery') {
      if (!street || !city || !deliveryPhone) {
        alert(language === 'ar' ? 'يرجى ملء جميع حقول التوصيل المطلوبة' : 'Please fill all required delivery fields');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Build shipping address
      const fullAddress = deliveryMethod === 'delivery'
        ? `${street}, ${area ? area + ', ' : ''}${city}`
        : shippingAddress || selectedUser.address || '';

      const response = await axios.post(
        '/api/admin/create-order-for-user',
        {
          userId: selectedUser._id,
          items: [
            {
              productId: product._id,
              quantity
            }
          ],
          shippingAddress: fullAddress,
          deliveryMethod,
          paymentMethod,
          deliveryPhone: deliveryMethod === 'delivery' ? deliveryPhone : selectedUser.phone,
          notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(language === 'ar' ? 'تم إنشاء الطلبية بنجاح!' : 'Order created successfully!');
      if (onSuccess) onSuccess(response.data.order);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.message || (language === 'ar' ? 'فشل في إنشاء الطلبية' : 'Failed to create order'));
    } finally {
      setLoading(false);
    }
  };

  // Calculate price based on user role and discounts
  const getProductPrice = () => {
    if (!selectedUser) {
      // إذا كان هناك خصم للزبائن
      if (product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice) {
        return product.customerDiscount.discountedPrice;
      }
      return product.customerPrice || product.price || 0;
    }

    if (selectedUser.role === 'member') {
      // إذا كان هناك خصم للأعضاء
      if (product.subscriberDiscount?.enabled && product.subscriberDiscount?.discountedPrice) {
        return product.subscriberDiscount.discountedPrice;
      }
      return product.subscriberPrice || product.price || 0;
    } else {
      // إذا كان هناك خصم للزبائن
      if (product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice) {
        return product.customerDiscount.discountedPrice;
      }
      return product.customerPrice || product.price || 0;
    }
  };

  // Get original price (before discount) for display
  const getOriginalPrice = () => {
    if (!selectedUser) {
      return product.customerPrice || product.price || 0;
    }

    if (selectedUser.role === 'member') {
      return product.subscriberPrice || product.price || 0;
    } else {
      return product.customerPrice || product.price || 0;
    }
  };

  // Check if there's an active discount
  const hasDiscount = () => {
    if (!selectedUser) {
      return product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice;
    }

    if (selectedUser.role === 'member') {
      return product.subscriberDiscount?.enabled && product.subscriberDiscount?.discountedPrice;
    } else {
      return product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice;
    }
  };

  const totalPrice = getProductPrice() * quantity;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{language === 'ar' ? 'إنشاء طلبية لعضو/زبون' : 'Create Order for Member/Customer'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          {/* Product Info */}
          <div className="product-summary">
            <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} />
            <div className="product-details">
              <h3>{product.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <p className="price" style={{ margin: 0 }}>{getProductPrice().toFixed(2)} ₪</p>
                {hasDiscount() && (
                  <>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#95a5a6',
                      textDecoration: 'line-through'
                    }}>
                      {getOriginalPrice().toFixed(2)} ₪
                    </p>
                    <span style={{
                      background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {language === 'ar' ? 'خصم' : 'Discount'}
                    </span>
                  </>
                )}
              </div>
              {selectedUser && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {language === 'ar'
                    ? `سعر ${selectedUser.role === 'member' ? 'العضو' : 'الزبون'}`
                    : `${selectedUser.role === 'member' ? 'Member' : 'Customer'} Price`}
                </p>
              )}
              {product.points > 0 && (
                <p className="points">
                  {language === 'ar' ? 'النقاط:' : 'Points:'} {product.points}
                </p>
              )}
            </div>
          </div>

          {/* User Search */}
          <div className="form-group">
            <label>{language === 'ar' ? 'ابحث عن العضو/الزبون *' : 'Search Member/Customer *'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value) setSelectedUser(null);
                }}
                placeholder={language === 'ar' ? 'اسم، يوزر، كود، أو رقم الهاتف...' : 'Name, username, code, or phone...'}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {searching && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>}

              {searchResults.length > 0 && !selectedUser && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #667eea',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  marginTop: '0'
                }}>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => selectUser(user)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#2c3e50' }}>{user.name}</strong>
                        <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>@{user.username}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {user.subscriberCode && (
                          <span style={{ background: '#3498db', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                            {user.subscriberCode}
                          </span>
                        )}
                        <span style={{
                          background: user.role === 'member' ? '#f39c12' : '#95a5a6',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {user.role === 'member' ? (language === 'ar' ? 'عضو' : 'Member') : (language === 'ar' ? 'زبون' : 'Customer')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="selected-user">
                ✓ {selectedUser.name} (@{selectedUser.username})
                {selectedUser.role === 'member' && (
                  <span className="member-badge">{language === 'ar' ? '⭐ عضو' : '⭐ Member'}</span>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label>{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {/* Delivery Method */}
          <div className="form-group">
            <label>{language === 'ar' ? 'طريقة التسليم *' : 'Delivery Method *'}</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span>{language === 'ar' ? '🏢 استلام من الشركة' : '🏢 Pickup from Company'}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span>{language === 'ar' ? '🚚 توصيل' : '🚚 Delivery'}</span>
              </label>
            </div>
          </div>

          {/* Delivery Details (if delivery) */}
          {deliveryMethod === 'delivery' && (
            <>
              <div className="form-group">
                <label>{language === 'ar' ? 'الشارع/العنوان التفصيلي *' : 'Street/Detailed Address *'}</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: شارع الملك، بناية 5' : 'e.g.: King Street, Building 5'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{language === 'ar' ? 'المدينة *' : 'City *'}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: نابلس' : 'e.g.: Nablus'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{language === 'ar' ? 'المنطقة/الحي' : 'Area/District'}</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: وسط البلد' : 'e.g.: Downtown'}
                />
              </div>

              <div className="form-group">
                <label>{language === 'ar' ? 'رقم الهاتف للتوصيل *' : 'Delivery Phone *'}</label>
                <input
                  type="tel"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  placeholder={language === 'ar' ? '0599123456' : '0599123456'}
                  required
                />
              </div>
            </>
          )}

          {/* Payment Method */}
          <div className="form-group">
            <label>{language === 'ar' ? 'طريقة الدفع *' : 'Payment Method *'}</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay_at_company"
                  checked={paymentMethod === 'pay_at_company'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>
                  {language === 'ar' ? '💵 دفع بالشركة' : '💵 Pay at Company'}
                  {selectedUser?.role === 'member' && (
                    <small>
                      {language === 'ar' ? ' (النقاط ستضاف فوراً)' : ' (Points added immediately)'}
                    </small>
                  )}
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>{language === 'ar' ? '🏠 الدفع عند التسليم' : '🏠 Cash on Delivery'}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
              rows="2"
            />
          </div>

          {/* Total */}
          <div className="order-total">
            <strong>{language === 'ar' ? 'المجموع:' : 'Total:'}</strong>
            <span className="total-amount">{totalPrice.toFixed(2)} ₪</span>
          </div>

          {selectedUser?.role === 'member' && paymentMethod === 'pay_at_company' && (
            <div className="points-info">
              ⭐ {language === 'ar' ? 'سيحصل العضو على' : 'Member will receive'} {product.points * quantity} {language === 'ar' ? 'نقطة فوراً' : 'points immediately'}
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? '✅ إنشاء الطلبية' : '✅ Create Order')}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderForUser;
