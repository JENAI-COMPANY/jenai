import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import '../styles/Verification.css';

const VerificationModal = ({ onClose, onSuccess, language }) => {
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    fullName: '',
    dateOfBirth: ''
  });
  const [idImageFile, setIdImageFile] = useState(null);
  const [idImagePreview, setIdImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!idImageFile) {
      setError(language === 'ar' ? 'يرجى رفع صورة الهوية' : 'Please upload ID image');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('idType', formData.idType);
      data.append('idNumber', formData.idNumber);
      data.append('fullName', formData.fullName);
      data.append('dateOfBirth', formData.dateOfBirth);
      data.append('idImage', idImageFile);

      const response = await axios.post('/api/verifications/submit', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="verification-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="verification-modal">
        <div className="verification-modal-header">
          <h2>🪪 {language === 'ar' ? 'توثيق الحساب' : 'Account Verification'}</h2>
          <button className="verification-close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="verification-modal-desc">
          {language === 'ar'
            ? 'أدخل بياناتك الشخصية كما تظهر في الهوية الرسمية'
            : 'Enter your personal details as they appear on your official ID'}
        </p>

        {error && <div className="verification-error">{error}</div>}

        <form onSubmit={handleSubmit} className="verification-form">
          {/* ID Type */}
          <div className="verification-field">
            <label>{language === 'ar' ? 'نوع الوثيقة' : 'Document Type'}</label>
            <div className="verification-radio-group">
              <label className="verification-radio-label">
                <input
                  type="radio"
                  value="national_id"
                  checked={formData.idType === 'national_id'}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                />
                <span>{language === 'ar' ? 'بطاقة هوية' : 'National ID'}</span>
              </label>
              <label className="verification-radio-label">
                <input
                  type="radio"
                  value="passport"
                  checked={formData.idType === 'passport'}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                />
                <span>{language === 'ar' ? 'جواز سفر' : 'Passport'}</span>
              </label>
            </div>
          </div>

          {/* ID Number */}
          <div className="verification-field">
            <label>{language === 'ar' ? 'رقم الهوية / الجواز' : 'ID / Passport Number'} *</label>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              placeholder={language === 'ar' ? 'أدخل رقم الهوية' : 'Enter ID number'}
              required
              dir="ltr"
            />
          </div>

          {/* Full Name */}
          <div className="verification-field">
            <label>{language === 'ar' ? 'الاسم الثلاثي كما في الهوية' : 'Full Name as in ID'} *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={language === 'ar' ? 'الاسم الأول، الأب، الجد' : 'First, Father, Grandfather'}
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="verification-field">
            <label>{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'} *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* ID Image */}
          <div className="verification-field">
            <label>{language === 'ar' ? 'صورة الهوية / الجواز' : 'ID / Passport Image'} *</label>
            <div className="verification-image-upload">
              {idImagePreview ? (
                <div className="verification-image-preview">
                  <img src={idImagePreview} alt="ID preview" />
                  <button
                    type="button"
                    className="verification-change-image-btn"
                    onClick={() => { setIdImageFile(null); setIdImagePreview(null); }}
                  >
                    {language === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                  </button>
                </div>
              ) : (
                <label className="verification-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div className="verification-upload-area">
                    <span className="verification-upload-icon">📷</span>
                    <span>{language === 'ar' ? 'اضغط لرفع الصورة' : 'Click to upload image'}</span>
                    <small>{language === 'ar' ? 'JPG, PNG, حتى 10MB' : 'JPG, PNG, up to 10MB'}</small>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="verification-form-actions">
            <button type="submit" className="verification-submit-btn" disabled={loading}>
              {loading
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                : (language === 'ar' ? 'إرسال طلب التوثيق' : 'Submit Verification Request')}
            </button>
            <button type="button" className="verification-cancel-btn" onClick={onClose}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default VerificationModal;
