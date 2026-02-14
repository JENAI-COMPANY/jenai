import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/News.css';

const News = () => {
  const { user } = useContext(AuthContext);
  const { language } = useLanguage();
  const isSuperAdmin = user?.role === 'super_admin';

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    contentAr: '',
    contentEn: '',
    image: '',
    category: 'عام',
    isActive: true,
    isPinned: false,
    author: 'فريق جيناي'
  });

  const categories = ['عام', 'إعلانات', 'عروض', 'تحديثات', 'أحداث'];

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, searchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      const res = await axios.get(`/api/news?${params.toString()}`);
      setNews(res.data.news || []);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titleAr: '',
      titleEn: '',
      contentAr: '',
      contentEn: '',
      image: '',
      category: 'عام',
      isActive: true,
      isPinned: false,
      author: 'فريق جيناي'
    });
    setEditingNews(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setFormData({
      titleAr: item.titleAr || '',
      titleEn: item.titleEn || '',
      contentAr: item.contentAr || '',
      contentEn: item.contentEn || '',
      image: item.image || '',
      category: item.category || 'عام',
      isActive: item.isActive !== false,
      isPinned: item.isPinned || false,
      author: item.author || 'فريق جيناي'
    });
    setShowForm(true);
    setShowModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titleAr.trim()) { setError('عنوان الخبر بالعربية مطلوب'); return; }
    if (!formData.contentAr.trim()) { setError('محتوى الخبر بالعربية مطلوب'); return; }

    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      if (editingNews) {
        await axios.put(`/api/news/${editingNews._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('تم تحديث الخبر بنجاح');
      } else {
        await axios.post('/api/news', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('تم إضافة الخبر بنجاح');
      }
      resetForm();
      fetchNews();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('تم حذف الخبر');
      setShowModal(false);
      fetchNews();
    } catch (err) {
      setError('فشل في حذف الخبر');
    }
  };

  const openNews = (item) => {
    setSelectedNews(item);
    setShowModal(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const pinnedNews = news.filter(n => n.isPinned);
  const regularNews = news.filter(n => !n.isPinned);

  return (
    <div className="news-page" dir="rtl">
      {/* Header */}
      <div className="news-hero">
        <div className="news-hero-content">
          <h1>📰 {language === 'ar' ? 'أخبار جيناي' : 'Jenai News'}</h1>
          <p>{language === 'ar' ? 'آخر الأخبار والمستجدات من فريق جيناي' : 'Latest news and updates from the Jenai team'}</p>
        </div>
      </div>

      <div className="news-container">
        {/* Success/Error */}
        {success && (
          <div className="news-alert news-alert-success">
            ✅ {success}
            <button onClick={() => setSuccess('')}>✕</button>
          </div>
        )}
        {error && (
          <div className="news-alert news-alert-error">
            ❌ {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Admin Add Button */}
        {isSuperAdmin && (
          <div className="news-admin-bar">
            <button
              className="news-add-btn"
              onClick={() => { resetForm(); setShowForm(!showForm); }}
            >
              {showForm ? '✕ إغلاق' : '+ إضافة خبر جديد'}
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {isSuperAdmin && showForm && (
          <div className="news-form-card">
            <h3>{editingNews ? '✏️ تعديل الخبر' : '➕ إضافة خبر جديد'}</h3>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="news-form-grid">
                <div className="news-form-group">
                  <label>عنوان الخبر بالعربية *</label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                    placeholder="عنوان الخبر..."
                    required
                  />
                </div>
                <div className="news-form-group">
                  <label>عنوان الخبر بالإنجليزية</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="News title..."
                  />
                </div>
                <div className="news-form-group">
                  <label>القسم</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="news-form-group">
                  <label>الكاتب</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    placeholder="اسم الكاتب..."
                  />
                </div>
                <div className="news-form-group news-full-width">
                  <label>رابط الصورة (اختياري)</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="news-form-group news-full-width">
                  <label>محتوى الخبر بالعربية *</label>
                  <textarea
                    value={formData.contentAr}
                    onChange={e => setFormData({ ...formData, contentAr: e.target.value })}
                    placeholder="اكتب محتوى الخبر هنا..."
                    rows={6}
                    required
                  />
                </div>
                <div className="news-form-group news-full-width">
                  <label>محتوى الخبر بالإنجليزية</label>
                  <textarea
                    value={formData.contentEn}
                    onChange={e => setFormData({ ...formData, contentEn: e.target.value })}
                    placeholder="Write news content here..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="news-form-checks">
                <label className="news-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                  📌 تثبيت الخبر في الأعلى
                </label>
                <label className="news-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  ✅ نشر الخبر
                </label>
              </div>
              {error && <div className="news-form-error">❌ {error}</div>}
              <div className="news-form-actions">
                <button type="submit" className="news-submit-btn" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : (editingNews ? 'حفظ التعديلات' : 'نشر الخبر')}
                </button>
                <button type="button" className="news-cancel-btn" onClick={resetForm}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Filter */}
        <div className="news-filters">
          <input
            type="text"
            className="news-search"
            placeholder="🔍 ابحث عن خبر..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="news-category-btns">
            <button
              className={`news-cat-btn ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`news-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="news-loading">
            <div className="news-spinner"></div>
            <p>جاري التحميل...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="news-empty">
            <div className="news-empty-icon">📰</div>
            <h3>لا توجد أخبار متاحة حالياً</h3>
            <p>ترقب آخر أخبار وتحديثات جيناي</p>
          </div>
        ) : (
          <>
            {/* Pinned News */}
            {pinnedNews.length > 0 && (
              <div className="news-section">
                <h2 className="news-section-title">📌 الأخبار المثبتة</h2>
                <div className="news-grid news-grid-featured">
                  {pinnedNews.map(item => (
                    <NewsCard
                      key={item._id}
                      item={item}
                      isSuperAdmin={isSuperAdmin}
                      onOpen={openNews}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                      language={language}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular News */}
            {regularNews.length > 0 && (
              <div className="news-section">
                {pinnedNews.length > 0 && <h2 className="news-section-title">📋 آخر الأخبار</h2>}
                <div className="news-grid">
                  {regularNews.map(item => (
                    <NewsCard
                      key={item._id}
                      item={item}
                      isSuperAdmin={isSuperAdmin}
                      onOpen={openNews}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* News Detail Modal */}
      {showModal && selectedNews && (
        <div className="news-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="news-modal" onClick={e => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setShowModal(false)}>✕</button>
            {selectedNews.image && (
              <div className="news-modal-image">
                <img src={selectedNews.image} alt={selectedNews.titleAr} />
              </div>
            )}
            <div className="news-modal-body">
              <div className="news-modal-meta">
                <span className="news-badge">{selectedNews.category}</span>
                {selectedNews.isPinned && <span className="news-badge news-badge-pinned">📌 مثبت</span>}
                <span className="news-date">🗓 {formatDate(selectedNews.createdAt)}</span>
                <span className="news-author">✍️ {selectedNews.author}</span>
              </div>
              <h2 className="news-modal-title">
                {language === 'ar' ? selectedNews.titleAr : (selectedNews.titleEn || selectedNews.titleAr)}
              </h2>
              <div className="news-modal-content">
                {(language === 'ar' ? selectedNews.contentAr : (selectedNews.contentEn || selectedNews.contentAr))
                  .split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
              </div>
              {isSuperAdmin && (
                <div className="news-modal-admin-actions">
                  <button className="news-edit-btn" onClick={() => handleEdit(selectedNews)}>
                    ✏️ تعديل
                  </button>
                  <button className="news-delete-btn" onClick={() => handleDelete(selectedNews._id)}>
                    🗑 حذف
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NewsCard = ({ item, isSuperAdmin, onOpen, onEdit, onDelete, formatDate, language, featured }) => (
  <div className={`news-card ${featured ? 'news-card-featured' : ''}`}>
    {item.image && (
      <div className="news-card-image" onClick={() => onOpen(item)}>
        <img src={item.image} alt={item.titleAr} />
        {item.isPinned && <span className="news-pin-badge">📌</span>}
      </div>
    )}
    {!item.image && item.isPinned && (
      <div className="news-card-no-image" onClick={() => onOpen(item)}>
        <span className="news-pin-badge-standalone">📌</span>
      </div>
    )}
    <div className="news-card-body">
      <div className="news-card-meta">
        <span className="news-badge">{item.category}</span>
        <span className="news-date">{formatDate(item.createdAt)}</span>
      </div>
      <h3 className="news-card-title" onClick={() => onOpen(item)}>
        {language === 'ar' ? item.titleAr : (item.titleEn || item.titleAr)}
      </h3>
      <p className="news-card-preview">
        {item.contentAr.length > 120 ? item.contentAr.substring(0, 120) + '...' : item.contentAr}
      </p>
      <div className="news-card-footer">
        <span className="news-author">✍️ {item.author}</span>
        <button className="news-read-btn" onClick={() => onOpen(item)}>
          اقرأ المزيد ←
        </button>
      </div>
      {isSuperAdmin && (
        <div className="news-card-admin">
          <button className="news-edit-sm" onClick={() => onEdit(item)}>✏️ تعديل</button>
          <button className="news-delete-sm" onClick={() => onDelete(item._id)}>🗑 حذف</button>
        </div>
      )}
    </div>
  </div>
);

export default News;
