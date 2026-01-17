import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import '../styles/SliderManagement.css';

const SliderManagement = () => {
  const { language } = useLanguage();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [formData, setFormData] = useState({
    alt: '',
    order: 0,
    isActive: true,
    image: null
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/sliders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSliders(response.data.sliders);
    } catch (error) {
      setError(language === 'ar' ? 'فشل تحميل الصور' : 'Failed to load sliders');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      formDataToSend.append('alt', formData.alt);
      formDataToSend.append('order', formData.order);
      formDataToSend.append('isActive', formData.isActive);

      if (editingSlider) {
        // Update existing slider
        await axios.put(
          `http://localhost:5000/api/sliders/${editingSlider._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم تحديث الصورة بنجاح!' : 'Slider updated successfully!');
      } else {
        // Create new slider
        if (!formData.image) {
          setError(language === 'ar' ? 'الرجاء اختيار صورة' : 'Please select an image');
          return;
        }

        await axios.post(
          'http://localhost:5000/api/sliders',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setMessage(language === 'ar' ? 'تم إضافة الصورة بنجاح!' : 'Slider added successfully!');
      }

      // Reset form
      setFormData({ alt: '', order: 0, isActive: true, image: null });
      setShowAddForm(false);
      setEditingSlider(null);
      fetchSliders();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || (language === 'ar' ? 'فشلت العملية' : 'Operation failed'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (slider) => {
    setEditingSlider(slider);
    setFormData({
      alt: slider.alt,
      order: slider.order,
      isActive: slider.isActive,
      image: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this slider?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/sliders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم حذف الصورة بنجاح!' : 'Slider deleted successfully!');
      fetchSliders();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError(language === 'ar' ? 'فشل حذف الصورة' : 'Failed to delete slider');
      setTimeout(() => setError(''), 3000);
    }
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingSlider(null);
    setFormData({ alt: '', order: 0, isActive: true, image: null });
  };

  return (
    <div className="slider-management">
      <div className="sm-header">
        <h2>{language === 'ar' ? 'إدارة صور العرض' : 'Slider Management'}</h2>
        {!showAddForm && (
          <button className="sm-add-btn" onClick={() => setShowAddForm(true)}>
            ➕ {language === 'ar' ? 'إضافة صورة جديدة' : 'Add New Slider'}
          </button>
        )}
      </div>

      {message && <div className="sm-success-message">{message}</div>}
      {error && <div className="sm-error-message">{error}</div>}

      {showAddForm && (
        <div className="sm-form-container">
          <h3>
            {editingSlider
              ? (language === 'ar' ? 'تعديل الصورة' : 'Edit Slider')
              : (language === 'ar' ? 'إضافة صورة جديدة' : 'Add New Slider')}
          </h3>
          <form onSubmit={handleSubmit} className="sm-form">
            <div className="sm-form-group">
              <label>{language === 'ar' ? 'الصورة' : 'Image'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editingSlider}
              />
              {editingSlider && (
                <small>{language === 'ar' ? 'اترك فارغاً للاحتفاظ بالصورة الحالية' : 'Leave empty to keep current image'}</small>
              )}
            </div>

            <div className="sm-form-group">
              <label>{language === 'ar' ? 'وصف الصورة' : 'Image Alt Text'}</label>
              <input
                type="text"
                name="alt"
                value={formData.alt}
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'وصف الصورة' : 'Image description'}
              />
            </div>

            <div className="sm-form-group">
              <label>{language === 'ar' ? 'الترتيب' : 'Order'}</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="sm-form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                {language === 'ar' ? 'نشط' : 'Active'}
              </label>
            </div>

            <div className="sm-form-buttons">
              <button type="submit" className="sm-submit-btn">
                {editingSlider
                  ? (language === 'ar' ? 'تحديث' : 'Update')
                  : (language === 'ar' ? 'إضافة' : 'Add')}
              </button>
              <button type="button" className="sm-cancel-btn" onClick={cancelEdit}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="sm-loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div className="sm-grid">
          {sliders.length === 0 ? (
            <p className="sm-empty">
              {language === 'ar' ? 'لا توجد صور حالياً' : 'No sliders yet'}
            </p>
          ) : (
            sliders.map((slider) => (
              <div key={slider._id} className="sm-card">
                <div className="sm-image-container">
                  <img
                    src={`http://localhost:5000${slider.image}`}
                    alt={slider.alt}
                    className="sm-image"
                  />
                  {!slider.isActive && (
                    <div className="sm-inactive-badge">
                      {language === 'ar' ? 'غير نشط' : 'Inactive'}
                    </div>
                  )}
                </div>
                <div className="sm-card-content">
                  <p className="sm-alt">{slider.alt}</p>
                  <p className="sm-order">
                    {language === 'ar' ? 'الترتيب' : 'Order'}: {slider.order}
                  </p>
                  <div className="sm-card-actions">
                    <button
                      className="sm-edit-btn"
                      onClick={() => handleEdit(slider)}
                    >
                      ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button
                      className="sm-delete-btn"
                      onClick={() => handleDelete(slider._id)}
                    >
                      🗑️ {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SliderManagement;
