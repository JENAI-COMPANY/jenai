import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import '../styles/Complaints.css';

const Complaints = () => {
  const { user } = useContext(AuthContext);
  const { language } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'other',
    subject: '',
    description: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(res.data.complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/complaints', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(language === 'ar' ? 'تم إرسال الشكوى بنجاح' : 'Complaint submitted successfully');
      setShowForm(false);
      setFormData({ type: 'other', subject: '', description: '' });
      fetchComplaints();
    } catch (error) {
      alert(language === 'ar' ? 'حدث خطأ' : 'Error submitting complaint');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      sponsor_change: language === 'ar' ? 'تغيير راعي' : 'Sponsor Change',
      product: language === 'ar' ? 'شكوى عن منتج' : 'Product Complaint',
      management: language === 'ar' ? 'شكوى عن الإدارة' : 'Management Complaint',
      member: language === 'ar' ? 'شكوى عن عضو' : 'Member Complaint',
      other: language === 'ar' ? 'أخرى' : 'Other'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { text: language === 'ar' ? 'قيد الانتظار' : 'Pending', color: '#f39c12' },
      under_review: { text: language === 'ar' ? 'قيد المراجعة' : 'Under Review', color: '#3498db' },
      resolved: { text: language === 'ar' ? 'تم الحل' : 'Resolved', color: '#27ae60' },
      closed: { text: language === 'ar' ? 'مغلق' : 'Closed', color: '#95a5a6' }
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <div className="complaints-page">
      <div className="complaints-header">
        <h1>{language === 'ar' ? 'الشكاوى والدعم' : 'Complaints & Support'}</h1>
        <button className="new-complaint-btn" onClick={() => setShowForm(!showForm)}>
          + {language === 'ar' ? 'شكوى جديدة' : 'New Complaint'}
        </button>
      </div>

      {showForm && (
        <div className="complaint-form-container">
          <form className="complaint-form" onSubmit={handleSubmit}>
            <h2>{language === 'ar' ? 'تقديم شكوى' : 'Submit Complaint'}</h2>

            <div className="form-group">
              <label>{language === 'ar' ? 'نوع الشكوى' : 'Complaint Type'}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="sponsor_change">{language === 'ar' ? 'تغيير راعي' : 'Sponsor Change'}</option>
                <option value="product">{language === 'ar' ? 'شكوى عن منتج' : 'Product Complaint'}</option>
                <option value="management">{language === 'ar' ? 'شكوى عن الإدارة' : 'Management'}</option>
                <option value="member">{language === 'ar' ? 'شكوى عن عضو' : 'Member'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'الموضوع' : 'Subject'}</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder={language === 'ar' ? 'موضوع الشكوى' : 'Complaint subject'}
              />
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'التفاصيل' : 'Description'}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="5"
                placeholder={language === 'ar' ? 'اشرح شكواك بالتفصيل' : 'Describe your complaint in detail'}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {language === 'ar' ? 'إرسال' : 'Submit'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="complaints-container">
        <h2>{language === 'ar' ? 'شكاواي' : 'My Complaints'}</h2>
        {complaints.length === 0 ? (
          <div className="no-complaints">
            <p>{language === 'ar' ? 'لا توجد شكاوى' : 'No complaints found'}</p>
          </div>
        ) : (
          <div className="complaints-list">
            {complaints.map(complaint => {
              const statusBadge = getStatusBadge(complaint.status);
              return (
                <div key={complaint._id} className="complaint-card">
                  <div className="complaint-header-card">
                    <div>
                      <h3>{complaint.subject}</h3>
                      <span className="complaint-type">{getTypeLabel(complaint.type)}</span>
                    </div>
                    <span className="status-badge" style={{ background: statusBadge.color }}>
                      {statusBadge.text}
                    </span>
                  </div>
                  <p className="complaint-description">{complaint.description}</p>
                  <div className="complaint-footer">
                    <span className="complaint-date">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    {complaint.responses && complaint.responses.length > 0 && (
                      <span className="responses-count">
                        {complaint.responses.length} {language === 'ar' ? 'رد' : 'Responses'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;
