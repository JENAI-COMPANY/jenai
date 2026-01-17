import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import '../styles/NewArrivals.css';

const NewArrivals = () => {
  const { language } = useLanguage();
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const data = await getProducts({ isNewArrival: true, limit: 8 });
      setNewProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="new-arrivals">
        <div className="new-arrivals-header">
          <h2>{language === 'ar' ? '🎁 وصل حديثاً' : '🎁 New Arrivals'}</h2>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (newProducts.length === 0) {
    return null;
  }

  return (
    <section className="new-arrivals">
      <div className="new-arrivals-header">
        <div>
          <h2>{language === 'ar' ? '🎁 وصل حديثاً' : '🎁 New Arrivals'}</h2>
          <p className="new-arrivals-subtitle">
            {language === 'ar'
              ? 'اكتشف أحدث المنتجات المضافة إلى متجرنا'
              : 'Discover the latest products added to our store'}
          </p>
        </div>
        <Link to="/products-page?filter=new" className="view-all-btn">
          {language === 'ar' ? 'عرض الكل' : 'View All'}
          <span className="arrow">{language === 'ar' ? '←' : '→'}</span>
        </Link>
      </div>

      <div className="new-arrivals-grid">
        {newProducts.map((product) => (
          <div key={product._id} className="new-arrival-item">
            <span className="new-badge">
              {language === 'ar' ? 'جديد' : 'NEW'}
            </span>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
