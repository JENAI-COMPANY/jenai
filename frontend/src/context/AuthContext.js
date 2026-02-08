import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const skipFetchRef = useRef(false);

  useEffect(() => {
    // تجاهل fetchUser إذا تم التسجيل أو تسجيل الدخول للتو
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      setLoading(false);
      return;
    }

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const { data } = await axios.get('/api/auth/me', config);
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      // منع fetchUser لأن البيانات موجودة بالفعل
      skipFetchRef.current = true;
      setUser(data.user);
      setToken(data.token);
      setLoading(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', data.token);
      // منع fetchUser لأن البيانات موجودة بالفعل
      skipFetchRef.current = true;
      setUser(data.user);
      setToken(data.token);
      setLoading(false);
      return {
        success: true,
        user: data.user,
        sponsor: data.sponsor
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // إزالة معلومات المستخدم
    localStorage.removeItem('token');

    // إزالة سلة التسوق للمستخدم الحالي
    if (user && user._id) {
      localStorage.removeItem(`cartItems_${user._id}`);
    }

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'super_admin' || user?.role === 'regional_admin' || user?.role === 'category_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isCategoryAdmin: user?.role === 'category_admin',
    isMember: user?.role === 'member',
    isCustomer: user?.role === 'customer',
    isSupplier: user?.role === 'supplier',
    // Legacy support for old 'subscriber' naming
    isSubscriber: user?.role === 'member'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
