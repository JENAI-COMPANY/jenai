import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import CallToAction from '../components/CallToAction';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import gsap from 'gsap';
import '../styles/Products.css';

const Products = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchRegions();

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

      // Get region from URL
      const regionParam = searchParams.get('region');
      if (regionParam) params.regionId = regionParam;

      // Get search term from state
      if (searchTerm) params.search = searchTerm;

      // Check for filter parameter (e.g., filter=new or filter=offers)
      const filterParam = searchParams.get('filter');
      if (filterParam === 'new') {
        params.isNewArrival = true;
      } else if (filterParam === 'offers') {
        params.isOffer = true;
      }

      params.limit = 1000; // عرض جميع المنتجات بدون حد
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

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/regions');
      if (response.data.success) {
        setRegions(response.data.regions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Get selected category
  const selectedCategoryName = searchParams.get('category');
  const selectedCategory = categories.find(cat => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    return catName === selectedCategoryName;
  });

  return (
    <div className="products-page">
      <div className="products-header" ref={headerRef}>
        {selectedCategory && typeof selectedCategory === 'object' && selectedCategory.image ? (
          <>
            <div className="category-header-image">
              <img
                src={selectedCategory.image}
                alt={language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}
              />
            </div>
            <h1>{language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}</h1>
            <p>{language === 'ar' ? selectedCategory.descriptionAr : selectedCategory.descriptionEn}</p>
          </>
        ) : (
          <>
            <h1>{language === 'ar' ? 'منتجاتنا' : 'Our Products'}</h1>
            <p>{language === 'ar' ? 'اكتشف مجموعتنا الواسعة من المنتجات عالية الجودة' : 'Discover our wide range of quality products'}</p>
          </>
        )}
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
            {categories.map((category) => {
              const catName = typeof category === 'string' ? category : category.name;
              const displayName = typeof category === 'string' ? category : (language === 'ar' ? (category.nameAr || category.name) : (category.nameEn || category.name));
              return (
                <option key={catName} value={catName}>
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="region-filter">
          <select
            value={searchParams.get('region') || ''}
            onChange={(e) => {
              const region = e.target.value;

              // تحديث الـ URL مع الحفاظ على المعاملات الموجودة
              const newParams = new URLSearchParams(searchParams);
              if (region) {
                newParams.set('region', region);
              } else {
                newParams.delete('region');
              }
              setSearchParams(newParams);
            }}
          >
            <option value="">🌍 {language === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>
            {regions.map((region) => (
              <option key={region._id} value={region._id}>
                {language === 'ar' ? region.nameAr : region.nameEn}
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
