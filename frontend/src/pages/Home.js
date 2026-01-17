import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import ImageSlider from '../components/ImageSlider';
import NewArrivals from '../components/NewArrivals';
import CategorySlider from '../components/CategorySlider';
import CallToAction from '../components/CallToAction';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';
import '../styles/Home.css';

const Home = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

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
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

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
    <div className="home">
      {/* Image Slider */}
      <ImageSlider />

      {/* Category Slider Section */}
      <CategorySlider />

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Call to Action */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <CallToAction variant="default" />
      </div>
    </div>
  );
};

export default Home;
