import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import '../styles/Favorites.css';

const Favorites = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFavorites(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading">
          <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>
          <span className="heart-icon">❤️</span>
          {language === 'ar' ? 'المفضلة' : 'My Favorites'}
        </h1>
        <p className="favorites-count">
          {favorites.length} {language === 'ar' ? 'منتج' : 'products'}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <div className="empty-icon">💔</div>
          <h2>{language === 'ar' ? 'قائمة المفضلة فارغة' : 'Your favorites list is empty'}</h2>
          <p>
            {language === 'ar'
              ? 'لم تقم بإضافة أي منتجات إلى المفضلة بعد'
              : "You haven't added any products to your favorites yet"}
          </p>
          <button className="browse-btn" onClick={() => navigate('/products')}>
            {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
