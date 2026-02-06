import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ReviewManagement.css';

const ReviewManagement = () => {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reviews/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.data);
        setStats({
          total: data.total,
          pending: data.pending,
          approved: data.approved
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (productId, reviewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${productId}/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleDelete = async (productId, reviewId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this review?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${productId}/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

  if (loading) {
    return (
      <div className="review-management loading">
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="review-management">
      <div className="review-header">
        <h2>{language === 'ar' ? 'إدارة التقييمات' : 'Review Management'}</h2>
        <button className="refresh-btn" onClick={fetchReviews}>
          🔄 {language === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="review-stats">
        <div className="stat-box total">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">{language === 'ar' ? 'إجمالي التقييمات' : 'Total Reviews'}</span>
        </div>
        <div className="stat-box pending">
          <span className="stat-number">{stats.pending}</span>
          <span className="stat-label">{language === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval'}</span>
        </div>
        <div className="stat-box approved">
          <span className="stat-number">{stats.approved}</span>
          <span className="stat-label">{language === 'ar' ? 'موافق عليها' : 'Approved'}</span>
        </div>
      </div>

      <div className="review-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {language === 'ar' ? 'الكل' : 'All'} ({stats.total})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          {language === 'ar' ? 'بانتظار الموافقة' : 'Pending'} ({stats.pending})
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          {language === 'ar' ? 'موافق عليها' : 'Approved'} ({stats.approved})
        </button>
      </div>

      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="no-reviews">
            <p>{language === 'ar' ? 'لا توجد تقييمات' : 'No reviews found'}</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review._id} className={`review-card ${!review.isApproved ? 'pending' : ''}`}>
              <div className="review-product-info">
                {review.productImage && (
                  <img
                    src={review.productImage}
                    alt={review.productNameAr || review.productName}
                    className="product-thumbnail"
                  />
                )}
                <div className="product-details">
                  <h4>{language === 'ar' ? review.productNameAr : review.productName}</h4>
                  <span className={`status-badge ${review.isApproved ? 'approved' : 'pending'}`}>
                    {review.isApproved
                      ? (language === 'ar' ? 'موافق عليه' : 'Approved')
                      : (language === 'ar' ? 'بانتظار الموافقة' : 'Pending')
                    }
                  </span>
                </div>
              </div>

              <div className="review-content">
                <div className="reviewer-info">
                  <strong>{review.userName || (language === 'ar' ? 'مجهول' : 'Anonymous')}</strong>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>

              <div className="review-actions">
                {!review.isApproved && (
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(review.productId, review._id)}
                  >
                    ✓ {language === 'ar' ? 'موافقة' : 'Approve'}
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(review.productId, review._id)}
                >
                  ✕ {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;
