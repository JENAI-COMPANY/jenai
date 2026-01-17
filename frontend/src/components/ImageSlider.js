import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import '../styles/ImageSlider.css';

const ImageSlider = () => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  // Fetch sliders from backend
  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/sliders');

        // If database has sliders, use them
        if (response.data.sliders && response.data.sliders.length > 0) {
          const slidersData = response.data.sliders.map(slider => ({
            id: slider._id,
            image: `http://localhost:5000${slider.image}`,
            alt: slider.alt,
            fallback: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1400&h=500&fit=crop'
          }));
          setSlides(slidersData);
        } else {
          // Use local default images if database is empty
          setSlides([
            {
              id: 1,
              image: '/images/slider1.jpg',
              alt: 'Natural skincare products',
              fallback: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1400&h=500&fit=crop'
            },
            {
              id: 2,
              image: '/images/slider2.jpg',
              alt: 'Jenai skincare banner',
              fallback: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1400&h=500&fit=crop'
            },
            {
              id: 3,
              image: '/images/slider3.jpg',
              alt: 'Premium skincare collection',
              fallback: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=1400&h=500&fit=crop'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
        // Fallback to local images if API fails
        setSlides([
          {
            id: 1,
            image: '/images/slider1.jpg',
            alt: 'Natural skincare products',
            fallback: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1400&h=500&fit=crop'
          },
          {
            id: 2,
            image: '/images/slider2.jpg',
            alt: 'Jenai skincare banner',
            fallback: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1400&h=500&fit=crop'
          },
          {
            id: 3,
            image: '/images/slider3.jpg',
            alt: 'Premium skincare collection',
            fallback: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=1400&h=500&fit=crop'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, []);

  const handleImageError = (slideId, fallback) => {
    setImageErrors(prev => ({ ...prev, [slideId]: fallback }));
  };

  useEffect(() => {
    // Auto-play slider - change slide every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    // Animate slide change with smooth right-to-left motion and fade
    if (sliderRef.current) {
      const allSlides = sliderRef.current.querySelectorAll('.slide');
      const currentSlideElement = allSlides[currentSlide];

      // Fade out all other slides
      allSlides.forEach((slide, index) => {
        if (index !== currentSlide) {
          gsap.to(slide, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut'
          });
        }
      });

      // Animate current slide in with smooth right-to-left motion
      if (currentSlideElement) {
        gsap.fromTo(
          currentSlideElement,
          { x: '100%', opacity: 0, scale: 1.05 },
          {
            x: '0%',
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: 'power3.out',
            clearProps: 'transform'
          }
        );
      }
    }
  }, [currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (loading) {
    return <div className="image-slider loading-slider">Loading...</div>;
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="image-slider" ref={sliderRef}>
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={imageErrors[slide.id] || slide.image}
              alt={slide.alt}
              onError={() => handleImageError(slide.id, slide.fallback)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button className="slider-arrow slider-arrow-left" onClick={goToPrevious}>
        &#8249;
      </button>
      <button className="slider-arrow slider-arrow-right" onClick={goToNext}>
        &#8250;
      </button>

      {/* Dots Navigation */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
