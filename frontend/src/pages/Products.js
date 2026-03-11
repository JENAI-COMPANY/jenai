import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import CallToAction from '../components/CallToAction';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import gsap from 'gsap';
import '../styles/Products.css';

const PAGE_SIZE = 10;

const Products = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  const isMounted = useRef(true);
  const prevProductsLength = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

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

  // Reset and fetch first page when filters change
  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(1, true);
  }, [searchParams, searchTerm]);

  useEffect(() => {
    // Only animate newly added cards, not existing ones
    if (gridRef.current && products.length > prevProductsLength.current) {
      const cards = Array.from(gridRef.current.children);
      const newCards = cards.slice(prevProductsLength.current);
      if (newCards.length > 0) {
        gsap.fromTo(
          newCards,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.2)' }
        );
      }
    }
    prevProductsLength.current = products.length;
  }, [products]);

  const buildParams = () => {
    const params = {};
    const categoryParam = searchParams.get('category');
    if (categoryParam) params.category = categoryParam;
    const regionParam = searchParams.get('region');
    if (regionParam) params.regionId = regionParam;
    if (searchTerm) params.search = searchTerm;
    const filterParam = searchParams.get('filter');
    if (filterParam === 'new') params.isNewArrival = true;
    else if (filterParam === 'offers') params.isOffer = true;
    return params;
  };

  const fetchProducts = async (pageNum = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = buildParams();
      params.limit = PAGE_SIZE;
      params.page = pageNum;

      const data = await getProducts(params);
      if (!isMounted.current) return;

      const fetched = data.products || [];
      if (reset) {
        prevProductsLength.current = 0;
        setProducts(fetched);
      } else {
        setProducts(prev => [...prev, ...fetched]);
      }
      const total = data.total || 0;
      const loaded = reset ? fetched.length : (pageNum - 1) * PAGE_SIZE + fetched.length;
      setHasMore(loaded < total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (isMounted.current) setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/regions');
      if (isMounted.current && response.data.success) {
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
              const newParams = new URLSearchParams(searchParams);
              if (category) newParams.set('category', category);
              else newParams.delete('category');
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
              const newParams = new URLSearchParams(searchParams);
              if (region) newParams.set('region', region);
              else newParams.delete('region');
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
        <>
          <div className="products-grid" ref={gridRef}>
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))
            ) : (
              <div className="no-products">{t('noProducts')}</div>
            )}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
                  : (language === 'ar' ? 'عرض المزيد' : 'Show More')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Call to Action */}
      <CallToAction variant="default" />
    </div>
  );
};

export default Products;
