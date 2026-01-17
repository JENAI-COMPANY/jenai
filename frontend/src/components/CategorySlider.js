import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/CategorySlider.css';

const CategorySlider = () => {
  const { language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const sliderRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && sliderRef.current) {
      startAnimation();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const startAnimation = () => {
    const slider = sliderRef.current;
    const items = slider.children;
    const totalWidth = slider.scrollWidth / 2;

    gsap.set(slider, { x: 0 });

    animationRef.current = gsap.to(slider, {
      x: -totalWidth,
      duration: 20,
      ease: 'none',
      repeat: -1,
    });
  };

  const handleMouseEnter = () => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  };

  const handleMouseLeave = () => {
    if (animationRef.current) {
      animationRef.current.resume();
    }
  };

  if (categories.length === 0) return null;

  // Duplicate categories for seamless loop
  const duplicatedCategories = [...categories, ...categories];

  return (
    <section className="category-slider-section">
      <div className="category-slider-header">
        <h2>{language === 'ar' ? 'تصفح الأقسام' : 'Browse Categories'}</h2>
        <p>{language === 'ar' ? 'اختر القسم الذي يناسبك' : 'Choose your preferred category'}</p>
      </div>

      <div
        className="category-slider-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="category-slider" ref={sliderRef}>
          {duplicatedCategories.map((category, index) => (
            <Link
              key={index}
              to={`/products-page?category=${encodeURIComponent(category)}`}
              className="category-circle"
            >
              <div className="category-circle-inner">
                <span className="category-name">{category}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
