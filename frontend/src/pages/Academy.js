import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import '../styles/Academy.css';

const Academy = () => {
  const { language } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/academy/courses');
      setCourses(res.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Mock data
      setCourses([
        {
          _id: '1',
          title: 'Introduction to Cooperative Marketing',
          titleAr: 'مقدمة في التسويق التعاوني',
          description: 'Learn the basics of cooperative marketing',
          descriptionAr: 'تعلم أساسيات التسويق التعاوني',
          level: 'beginner',
          duration: 30,
          points: 10,
          isFree: true,
          thumbnail: 'https://via.placeholder.com/400x250'
        },
        {
          _id: '2',
          title: 'Building Your Team',
          titleAr: 'بناء فريقك',
          description: 'Strategies for recruiting and managing your team',
          descriptionAr: 'استراتيجيات لتوظيف وإدارة فريقك',
          level: 'intermediate',
          duration: 45,
          points: 15,
          isFree: true,
          thumbnail: 'https://via.placeholder.com/400x250'
        },
        {
          _id: '3',
          title: 'Advanced Sales Techniques',
          titleAr: 'تقنيات المبيعات المتقدمة',
          description: 'Master advanced selling strategies',
          descriptionAr: 'إتقان استراتيجيات البيع المتقدمة',
          level: 'advanced',
          duration: 60,
          points: 20,
          isFree: false,
          price: 29.99,
          thumbnail: 'https://via.placeholder.com/400x250'
        }
      ]);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return course.level === filter;
  });

  const getLevelBadge = (level) => {
    const badges = {
      beginner: { text: language === 'ar' ? 'مبتدئ' : 'Beginner', color: '#27ae60' },
      intermediate: { text: language === 'ar' ? 'متوسط' : 'Intermediate', color: '#f39c12' },
      advanced: { text: language === 'ar' ? 'متقدم' : 'Advanced', color: '#e74c3c' }
    };
    return badges[level] || badges.beginner;
  };

  return (
    <div className="academy-page">
      <div className="academy-hero">
        <h1>🎓 {language === 'ar' ? 'أكاديمية جيناي' : 'Jenai Academy'}</h1>
        <p>{language === 'ar' ? 'طور مهاراتك واكسب النقاط' : 'Develop Your Skills and Earn Points'}</p>
      </div>

      <div className="academy-container">
        <div className="filter-section">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          <button
            className={`filter-btn ${filter === 'beginner' ? 'active' : ''}`}
            onClick={() => setFilter('beginner')}
          >
            {language === 'ar' ? 'مبتدئ' : 'Beginner'}
          </button>
          <button
            className={`filter-btn ${filter === 'intermediate' ? 'active' : ''}`}
            onClick={() => setFilter('intermediate')}
          >
            {language === 'ar' ? 'متوسط' : 'Intermediate'}
          </button>
          <button
            className={`filter-btn ${filter === 'advanced' ? 'active' : ''}`}
            onClick={() => setFilter('advanced')}
          >
            {language === 'ar' ? 'متقدم' : 'Advanced'}
          </button>
        </div>

        <div className="courses-grid">
          {filteredCourses.map(course => {
            const badge = getLevelBadge(course.level);
            return (
              <div key={course._id} className="course-card">
                <div className="course-thumbnail">
                  <img src={course.thumbnail} alt={language === 'ar' ? course.titleAr : course.title} />
                  <div className="level-badge" style={{ background: badge.color }}>
                    {badge.text}
                  </div>
                  {!course.isFree && (
                    <div className="price-badge">${course.price}</div>
                  )}
                </div>
                <div className="course-content">
                  <h3>{language === 'ar' ? course.titleAr : course.title}</h3>
                  <p>{language === 'ar' ? course.descriptionAr : course.description}</p>
                  <div className="course-meta">
                    <span className="duration">⏱️ {course.duration} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    <span className="points">🎯 {course.points} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                  </div>
                  <button className="start-btn" onClick={() => setSelectedCourse(course)}>
                    {course.isFree
                      ? (language === 'ar' ? 'ابدأ الآن' : 'Start Now')
                      : (language === 'ar' ? 'شراء الدورة' : 'Buy Course')
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCourse && (
        <div className="course-modal" onClick={() => setSelectedCourse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCourse(null)}>×</button>
            <h2>{language === 'ar' ? selectedCourse.titleAr : selectedCourse.title}</h2>
            <p>{language === 'ar' ? selectedCourse.descriptionAr : selectedCourse.description}</p>
            <div className="video-placeholder">
              <p>📹 {language === 'ar' ? 'الفيديو سيتم عرضه هنا' : 'Video will be displayed here'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Academy;
