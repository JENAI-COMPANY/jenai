import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useContext(CartContext);
  const { isSubscriber } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>{t('emptyCart')}</h2>
        <button onClick={() => navigate('/')} className="shop-btn">
          {t('continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>{t('cartTitle')}</h2>
      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item, index) => {
            const displayPrice = isSubscriber ? (item.subscriberPrice || 0) : (item.customerPrice || 0);
            // Create unique key combining product ID, color, and size
            const uniqueKey = `${item._id}-${item.selectedColor || 'nocolor'}-${item.selectedSize || 'nosize'}-${index}`;
            return (
              <div key={uniqueKey} className="cart-item">
                <div className="item-image">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="no-image">{language === 'ar' ? 'لا توجد صورة' : 'No Image'}</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  {item.selectedColor && (
                    <p className="item-option">
                      <strong>{language === 'ar' ? 'اللون:' : 'Color:'}</strong> {item.selectedColor}
                    </p>
                  )}
                  {item.selectedSize && (
                    <p className="item-option">
                      <strong>{language === 'ar' ? 'النمرة:' : 'Size:'}</strong> {item.selectedSize}
                    </p>
                  )}
                  <p className="item-price">₪{displayPrice.toFixed(2)}</p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedColor || '', item.selectedSize || '')}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedColor || '', item.selectedSize || '')}>
                    +
                  </button>
                </div>
                <div className="item-total">
                  ₪{(displayPrice * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item._id, item.selectedColor || '', item.selectedSize || '')}
                  className="remove-btn"
                >
                  {t('remove')}
                </button>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h3>{t('orderSummary')}</h3>
          <div className="summary-total">
            <span>{t('total')}:</span>
            <span>
              ₪{getCartTotal(isSubscriber).toFixed(2)}
            </span>
          </div>
          {isSubscriber && (
            <div className="subscriber-savings">
              {t('subscriberSavings')}
            </div>
          )}
          <button onClick={handleCheckout} className="checkout-btn">
            {t('proceedToCheckout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
