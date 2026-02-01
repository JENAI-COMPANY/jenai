import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

// دالة للحصول على معرف المستخدم الحالي
const getCurrentUserId = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser._id || 'guest';
    } catch {
      return 'guest';
    }
  }
  return 'guest';
};

// دالة للحصول على مفتاح السلة الخاص بالمستخدم
const getCartKey = () => {
  const userId = getCurrentUserId();
  return `cartItems_${userId}`;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUserId());

  // مراقبة تغيير المستخدم
  useEffect(() => {
    const checkUserChange = () => {
      const newUserId = getCurrentUserId();
      if (newUserId !== currentUser) {
        setCurrentUser(newUserId);
        loadCart(newUserId);
      }
    };

    // فحص كل ثانية إذا تغير المستخدم
    const interval = setInterval(checkUserChange, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // تحميل السلة عند بدء التشغيل
  useEffect(() => {
    loadCart(currentUser);
  }, []);

  const loadCart = (userId) => {
    const cartKey = `cartItems_${userId}`;
    const savedCart = localStorage.getItem(cartKey);

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // التحقق من صحة البيانات
        const validCart = parsedCart.filter(item =>
          (item.id || item._id) &&
          item.name &&
          (item.customerPrice !== undefined || item.subscriberPrice !== undefined)
        );

        if (validCart.length !== parsedCart.length) {
          console.log('🗑️ Removing invalid items from cart');
          localStorage.setItem(cartKey, JSON.stringify(validCart));
        }

        setCartItems(validCart);
      } catch (error) {
        console.error('Error parsing cart:', error);
        localStorage.removeItem(cartKey);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  // حفظ السلة عند التغيير
  useEffect(() => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const productId = product.id || product._id;
      const existingItem = prevItems.find((item) => (item.id || item._id) === productId);
      if (existingItem) {
        return prevItems.map((item) =>
          (item.id || item._id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // حفظ الحقول المطلوبة فقط لتجنب مشاكل localStorage
      const cartItem = {
        _id: productId,
        id: productId,
        name: product.name,
        description: product.description,
        customerPrice: product.customerPrice,
        subscriberPrice: product.subscriberPrice,
        points: product.points || 0,
        stock: product.stock,
        images: product.images,
        category: product.category,
        quantity: quantity
      };

      return [...prevItems, cartItem];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => (item.id || item._id) !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        (item.id || item._id) === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = (isSubscriber = false) => {
    return cartItems.reduce((total, item) => {
      const price = isSubscriber ? (item.subscriberPrice || 0) : (item.customerPrice || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
