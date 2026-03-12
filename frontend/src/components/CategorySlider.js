import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/CategorySlider.css';

const CategorySlider = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      const categoriesData = (data.categories || []).map(cat => {
        if (typeof cat === 'string') {
          return { name: cat, nameAr: cat, nameEn: cat, image: '' };
        }
        return {
          ...cat,
          name: cat.name || cat.nameAr || cat.nameEn || '',
          nameAr: cat.nameAr || cat.name || '',
          nameEn: cat.nameEn || cat.name || ''
        };
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (categories.length === 0) return null;

  const duplicatedCategories = [...categories, ...categories];

  return (
    <section className="category-slider-section">
      <div className="category-slider-header">
        <h2>{language === 'ar' ? 'تصفح الأقسام' : 'Browse Categories'}</h2>
        <p>{language === 'ar' ? 'اختر القسم الذي يناسبك' : 'Choose your preferred category'}</p>
      </div>

      <div className="category-slider-container">
        <div className="category-slider">
          {duplicatedCategories.map((category, index) => (
            <Link
              key={`category-${index}`}
              to={`/products-page?category=${encodeURIComponent(category.name)}`}
              className="category-circle"
            >
              <div className="category-circle-inner">
                {category.image && (
                  <img src={category.image} alt={language === 'ar' ? category.nameAr : category.nameEn} className="category-image" />
                )}
                <span className="category-name">
                  {language === 'ar' ? category.nameAr : category.nameEn}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
