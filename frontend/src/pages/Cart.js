import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useContext(CartContext);
  const { isSubscriber } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="shop-btn">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => {
            const displayPrice = isSubscriber ? (item.subscriberPrice || item.price || 0) : (item.price || 0);
            return (
              <div key={item._id} className="cart-item">
                <div className="item-image">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">${displayPrice.toFixed(2)}</p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <div className="item-total">
                  ${(displayPrice * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${getCartTotal(isSubscriber).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>$10.00</span>
          </div>
          <div className="summary-row">
            <span>Tax:</span>
            <span>${(getCartTotal(isSubscriber) * 0.08).toFixed(2)}</span>
          </div>
          <div className="summary-total">
            <span>Total:</span>
            <span>
              ${(getCartTotal(isSubscriber) + 10 + getCartTotal(isSubscriber) * 0.08).toFixed(2)}
            </span>
          </div>
          {isSubscriber && (
            <div className="subscriber-savings">
              You're saving with subscriber pricing!
            </div>
          )}
          <button onClick={handleCheckout} className="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
