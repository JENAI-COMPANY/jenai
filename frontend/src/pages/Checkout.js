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

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const itemsPrice = getCartTotal(isSubscriber);
  const shippingPrice = 10;
  const taxPrice = itemsPrice * 0.08;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

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
        price: isSubscriber ? item.subscriberPrice : item.price
      }));

      const orderData = {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: itemsPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2)
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

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="checkout-section">
          <h3>Shipping Address</h3>
          <div className="form-row">
            <input
              type="text"
              name="street"
              placeholder="Street Address"
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

        <div className="checkout-section">
          <h3>طريقة الدفع / Payment Method</h3>
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
            <label className="payment-option">
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
            <label className="payment-option">
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
              <span>${itemsPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>${shippingPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>${taxPrice.toFixed(2)}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
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
