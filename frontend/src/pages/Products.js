import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import CallToAction from '../components/CallToAction';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/Products.css';

const Products = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchCategories();

    // Animate header on mount
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams, searchTerm]);

  useEffect(() => {
    // Animate product grid when products change
    if (gridRef.current && products.length > 0) {
      const cards = gridRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }
      );
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};

      // Get category from URL
      const categoryParam = searchParams.get('category');
      if (categoryParam) params.category = categoryParam;

      // Get search term from state
      if (searchTerm) params.search = searchTerm;

      // Check for filter parameter (e.g., filter=new)
      const filterParam = searchParams.get('filter');
      if (filterParam === 'new') {
        params.isNewArrival = true;
      }

      const data = await getProducts(params);
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div className="products-page">
      <div className="products-header" ref={headerRef}>
        <h1>Our Products</h1>
        <p>Discover our wide range of quality products</p>
      </div>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <select
            value={searchParams.get('category') || ''}
            onChange={(e) => {
              const category = e.target.value;

              // تحديث الـ URL مع الحفاظ على المعاملات الموجودة
              const newParams = new URLSearchParams(searchParams);
              if (category) {
                newParams.set('category', category);
              } else {
                newParams.delete('category');
              }
              setSearchParams(newParams);
            }}
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading"></div>
      ) : (
        <div className="products-grid" ref={gridRef}>
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))
          ) : (
            <div className="no-products">{t('noProducts')}</div>
          )}
        </div>
      )}

      {/* Call to Action */}
      <CallToAction variant="default" />
    </div>
  );
};

export default Products;
