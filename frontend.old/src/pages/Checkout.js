import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { createOrder } from '../services/api';
import '../styles/Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const { isSubscriber, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // أرقام الهاتف للتواصل - لضمان عدم إرجاع الطرد
  const [contactPhone, setContactPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // طلب حسب المواصفات (Custom Order)
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [customOrderDetails, setCustomOrderDetails] = useState({
    specifications: '',
    requestedDeliveryDate: '',
    additionalNotes: ''
  });

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const itemsPrice = getCartTotal(isSubscriber);
  const shippingPrice = 0;
  const taxPrice = 0;
  const totalPrice = itemsPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = cartItems.map((item) => ({
        product: item._id,
        name: item.name,
        quantity: item.quantity,
        price: isSubscriber ? (item.subscriberPrice || 0) : (item.customerPrice || 0),
        points: item.points || 0
      }));

      // التحقق من صحة الأسعار
      const validItemsPrice = !isNaN(itemsPrice) && isFinite(itemsPrice) ? itemsPrice : 0;
      const validTaxPrice = !isNaN(taxPrice) && isFinite(taxPrice) ? taxPrice : 0;
      const validShippingPrice = !isNaN(shippingPrice) && isFinite(shippingPrice) ? shippingPrice : 0;
      const validTotalPrice = !isNaN(totalPrice) && isFinite(totalPrice) ? totalPrice : 0;

      const orderData = {
        orderItems,
        shippingAddress,
        contactPhone,
        alternatePhone,
        paymentMethod,
        itemsPrice: parseFloat(validItemsPrice.toFixed(2)),
        taxPrice: parseFloat(validTaxPrice.toFixed(2)),
        shippingPrice: parseFloat(validShippingPrice.toFixed(2)),
        totalPrice: parseFloat(validTotalPrice.toFixed(2)),
        isCustomOrder,
        customOrderDetails: isCustomOrder ? customOrderDetails : null
      };

      const response = await createOrder(orderData);

      if (response.success) {
        clearCart();
        navigate(`/orders/${response.order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  // التحقق من صحة بيانات السلة
  const hasInvalidItems = cartItems.some(item => !item._id || !item.name || (!item.customerPrice && !item.subscriberPrice));

  if (hasInvalidItems) {
    return (
      <div className="checkout-container">
        <h2>خطأ في السلة / Cart Error</h2>
        <div className="error-message">
          <p>⚠️ السلة تحتوي على منتجات غير صالحة. يرجى مسح السلة وإضافة منتجات جديدة.</p>
          <p>The cart contains invalid items. Please clear the cart and add new products.</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            navigate('/');
          }}
          className="place-order-btn"
          style={{ marginTop: '20px' }}
        >
          مسح السلة والعودة للصفحة الرئيسية / Clear Cart & Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* قسم أرقام الهاتف - مهم جداً لضمان التوصيل */}
        <div className="checkout-section">
          <h3>📞 أرقام التواصل / Contact Numbers</h3>
          <p className="section-note">
            ⚠️ يرجى إدخال رقمين للتواصل لضمان عدم إرجاع الطرد في حالة عدم الرد
          </p>
          <div className="form-row">
            <div className="input-group">
              <label>رقم الهاتف الأساسي *</label>
              <input
                type="tel"
                name="contactPhone"
                placeholder="مثال: 0791234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="input-group">
              <label>رقم الهاتف البديل *</label>
              <input
                type="tel"
                name="alternatePhone"
                placeholder="رقم آخر للتواصل"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                required
                dir="ltr"
              />
            </div>
          </div>
          <p className="phone-warning">
            🔴 مهم: تأكد من صحة الأرقام لتجنب إرجاع الطرد وتأخير التوصيل
          </p>
        </div>

        <div className="checkout-section">
          <h3>📍 عنوان الشحن / Shipping Address</h3>
          <div className="form-row">
            <input
              type="text"
              name="street"
              placeholder="Street Address / العنوان التفصيلي"
              value={shippingAddress.street}
              onChange={handleAddressChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={shippingAddress.city}
              onChange={handleAddressChange}
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={shippingAddress.state}
              onChange={handleAddressChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              name="zipCode"
              placeholder="ZIP Code"
              value={shippingAddress.zipCode}
              onChange={handleAddressChange}
              required
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={shippingAddress.country}
              onChange={handleAddressChange}
              required
            />
          </div>
        </div>

        {/* قسم الطلب حسب المواصفات */}
        <div className="checkout-section">
          <h3>🎨 طلب حسب المواصفات / Custom Order</h3>
          <div className="custom-order-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isCustomOrder}
                onChange={(e) => setIsCustomOrder(e.target.checked)}
              />
              <span className="toggle-text">
                هل تريد طلب منتج بمواصفات خاصة؟
              </span>
            </label>
          </div>

          {isCustomOrder && (
            <div className="custom-order-form">
              <p className="custom-order-note">
                ✨ يمكنك طلب منتج بمواصفات خاصة حسب رغبتك. سيتم التواصل معك لتأكيد التفاصيل والسعر.
              </p>

              <div className="input-group">
                <label>📝 المواصفات المطلوبة *</label>
                <textarea
                  name="specifications"
                  placeholder="اكتب المواصفات المطلوبة بالتفصيل (الحجم، اللون، المادة، التصميم، إلخ...)"
                  value={customOrderDetails.specifications}
                  onChange={(e) => setCustomOrderDetails({
                    ...customOrderDetails,
                    specifications: e.target.value
                  })}
                  required={isCustomOrder}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>📅 موعد التسليم المطلوب *</label>
                  <input
                    type="date"
                    name="requestedDeliveryDate"
                    value={customOrderDetails.requestedDeliveryDate}
                    onChange={(e) => setCustomOrderDetails({
                      ...customOrderDetails,
                      requestedDeliveryDate: e.target.value
                    })}
                    required={isCustomOrder}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>📋 ملاحظات إضافية (اختياري)</label>
                <textarea
                  name="additionalNotes"
                  placeholder="أي ملاحظات أخرى تريد إضافتها..."
                  value={customOrderDetails.additionalNotes}
                  onChange={(e) => setCustomOrderDetails({
                    ...customOrderDetails,
                    additionalNotes: e.target.value
                  })}
                  rows="2"
                />
              </div>

              <div className="custom-order-warning">
                <p>⚠️ <strong>ملاحظة:</strong> الطلبات المخصصة قد تتطلب دفعة مقدمة وسيتم تأكيد السعر النهائي بعد مراجعة المواصفات.</p>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-section">
          <h3>💳 طريقة الدفع / Payment Method</h3>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                value="cash_on_delivery"
                checked={paymentMethod === 'cash_on_delivery'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">
                🚚 الدفع عند التوصيل / Cash on Delivery
                <small className="payment-description">ادفع نقداً عند استلام طلبك</small>
              </span>
            </label>
            <label className="payment-option" style={{ display: 'none' }}>
              <input
                type="radio"
                value="cash_at_company"
                checked={paymentMethod === 'cash_at_company'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">
                🏢 كاش بالشركة / Cash at Company
                <small className="payment-description">ادفع نقداً مباشرة في مقر الشركة</small>
              </span>
            </label>
            <label className="payment-option" style={{ display: 'none' }}>
              <input
                type="radio"
                value="reflect"
                checked={paymentMethod === 'reflect'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">
                💳 ريفليكت / Reflect
                <small className="payment-description">الدفع عبر تطبيق ريفليكت</small>
              </span>
            </label>
          </div>

          {paymentMethod === 'cash_on_delivery' && (
            <div className="cod-info">
              <p className="cod-note">
                ✓ لا حاجة للدفع الآن. ادفع نقداً عند وصول طلبك إلى عنوانك.
              </p>
            </div>
          )}

          {paymentMethod === 'cash_at_company' && (
            <div className="cod-info">
              <p className="cod-note">
                ✓ يمكنك زيارة مقر الشركة والدفع نقداً واستلام طلبك مباشرة.
              </p>
            </div>
          )}

          {paymentMethod === 'reflect' && (
            <div className="cod-info">
              <p className="cod-note">
                ✓ سيتم إرسال رابط الدفع عبر تطبيق ريفليكت بعد تأكيد الطلب.
              </p>
            </div>
          )}
        </div>

        <div className="checkout-section">
          <h3>Order Summary</h3>
          <div className="order-summary">
            <div className="summary-row">
              <span>Items:</span>
              <span>₪{itemsPrice.toFixed(2)}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>₪{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button type="submit" className="place-order-btn" disabled={loading}>
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
