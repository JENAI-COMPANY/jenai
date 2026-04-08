import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const CartContext = createContext();

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isLoggedIn = () => !!localStorage.getItem('token');

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // تحميل السلة عند البدء أو عند تسجيل الدخول
  const loadCart = async () => {
    if (!isLoggedIn()) {
      setCartItems([]);
      setCartLoaded(true);
      return;
    }
    try {
      const { data } = await axios.get('/api/cart', { headers: getAuthHeader() });
      setCartItems(data.items || []);
    } catch (error) {
      setCartItems([]);
    } finally {
      setCartLoaded(true);
    }
  };

  useEffect(() => {
    loadCart();

    // مراقبة تسجيل الدخول/الخروج
    const handleStorageChange = () => loadCart();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleStorageChange);
    window.addEventListener('userLoggedOut', () => setCartItems([]));
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleStorageChange);
      window.removeEventListener('userLoggedOut', () => setCartItems([]));
    };
  }, []);

  const addToCart = async (product, quantity = 1, selectedColor = '', selectedSize = '') => {
    if (!isLoggedIn()) return;
    try {
      const { data } = await axios.post('/api/cart/add', {
        product: product._id || product.id,
        name: product.name,
        description: product.description,
        customerPrice: product.customerPrice,
        subscriberPrice: product.subscriberPrice,
        points: product.points || 0,
        stock: product.stock,
        images: product.images,
        category: product.category,
        quantity,
        selectedColor: selectedColor || '',
        selectedSize: selectedSize || '',
        customerDiscount: product.customerDiscount,
        subscriberDiscount: product.subscriberDiscount
      }, { headers: getAuthHeader() });
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId, selectedColor = '', selectedSize = '') => {
    if (!isLoggedIn()) return;
    try {
      const { data } = await axios.delete('/api/cart/remove', {
        headers: getAuthHeader(),
        data: { product: productId, selectedColor: selectedColor || '', selectedSize: selectedSize || '' }
      });
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId, quantity, selectedColor = '', selectedSize = '') => {
    if (!isLoggedIn()) return;
    if (quantity <= 0) {
      await removeFromCart(productId, selectedColor, selectedSize);
      return;
    }
    try {
      const { data } = await axios.put('/api/cart/update', {
        product: productId,
        quantity,
        selectedColor: selectedColor || '',
        selectedSize: selectedSize || ''
      }, { headers: getAuthHeader() });
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const clearCart = async () => {
    if (!isLoggedIn()) {
      setCartItems([]);
      return;
    }
    try {
      await axios.delete('/api/cart/clear', { headers: getAuthHeader() });
      setCartItems([]);
    } catch (error) {
      setCartItems([]);
    }
  };

  const getCartTotal = (isSubscriber = false) => {
    return cartItems.reduce((total, item) => {
      let price = isSubscriber ? (item.subscriberPrice || 0) : (item.customerPrice || 0);
      // تطبيق الخصم إن وجد
      if (isSubscriber && item.subscriberDiscount?.enabled && item.subscriberDiscount?.discountedPrice) {
        price = item.subscriberDiscount.discountedPrice;
      } else if (!isSubscriber && item.customerDiscount?.enabled && item.customerDiscount?.discountedPrice) {
        price = item.customerDiscount.discountedPrice;
      }
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    cartLoaded,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
