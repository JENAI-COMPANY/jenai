import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Verification.css';

const VerificationManagement = ({ language }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVerifications();
    // eslint-disable-next-line
  }, [filterStatus]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/verifications/all?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setVerifications(response.data.verifications);
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification) => {
    if (!window.confirm(language === 'ar' ? 'هل تريد قبول هذا التوثيق؟' : 'Approve this verification?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/verifications/${verification._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم قبول التوثيق' : 'Verification approved');
      fetchVerifications();
      setSelectedVerification(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectNote.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة سبب الرفض' : 'Please enter rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/verifications/${selectedVerification._id}/reject`, { adminNote: rejectNote }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(language === 'ar' ? 'تم رفض التوثيق' : 'Verification rejected');
      setShowRejectModal(false);
      setRejectNote('');
      setSelectedVerification(null);
      fetchVerifications();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const statusLabel = (status) => {
    if (status === 'pending') return language === 'ar' ? 'قيد المراجعة' : 'Pending';
    if (status === 'approved') return language === 'ar' ? 'موثق' : 'Approved';
    if (status === 'rejected') return language === 'ar' ? 'مرفوض' : 'Rejected';
    return status;
  };

  const idTypeLabel = (type) => type === 'national_id'
    ? (language === 'ar' ? 'بطاقة هوية' : 'National ID')
    : (language === 'ar' ? 'جواز سفر' : 'Passport');

  return (
    <div className="verification-management">
      <h2 className="vm-title">🪪 {language === 'ar' ? 'إدارة التوثيقات' : 'Verification Management'}</h2>

      {message && <div className="vm-message">{message}</div>}

      {/* Filter Tabs */}
      <div className="vm-filter-tabs">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`vm-filter-btn ${filterStatus === s ? 'active' : ''} vm-status-${s}`}
            onClick={() => setFilterStatus(s)}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="vm-loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : verifications.length === 0 ? (
        <div className="vm-empty">
          {language === 'ar' ? 'لا توجد طلبات توثيق' : 'No verification requests'}
        </div>
      ) : (
        <div className="vm-list">
          {verifications.map(v => (
            <div
              key={v._id}
              className={`vm-card vm-status-${v.status}`}
              onClick={() => setSelectedVerification(v)}
            >
              <div className="vm-card-header">
                <span className="vm-user-name">{v.user?.name}</span>
                <span className={`vm-status-badge vm-badge-${v.status}`}>{statusLabel(v.status)}</span>
              </div>
              <div className="vm-card-info">
                <span>👤 {v.user?.username}</span>
                <span>📱 {v.user?.phone}</span>
                {v.subscriberCode && <span>🔑 {v.subscriberCode}</span>}
                <span>📋 {idTypeLabel(v.idType)}: {v.idNumber}</span>
                <span>📅 {new Date(v.createdAt).toLocaleDateString('ar')}</span>
              </div>
              {v.status === 'rejected' && v.adminNote && (
                <div className="vm-reject-note">
                  ❌ {language === 'ar' ? 'سبب الرفض:' : 'Rejection reason:'} {v.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVerification && (
        <div className="verification-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedVerification(null)}>
          <div className="vm-detail-modal">
            <div className="vm-detail-header">
              <h3>🪪 {language === 'ar' ? 'تفاصيل التوثيق' : 'Verification Details'}</h3>
              <button className="verification-close-btn" onClick={() => setSelectedVerification(null)}>✕</button>
            </div>

            <div className="vm-detail-body">
              <div className="vm-detail-section">
                <h4>{language === 'ar' ? 'معلومات العضو' : 'Member Info'}</h4>
                <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {selectedVerification.user?.name}</p>
                <p><strong>{language === 'ar' ? 'المستخدم:' : 'Username:'}</strong> {selectedVerification.user?.username}</p>
                <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {selectedVerification.user?.phone}</p>
                {selectedVerification.subscriberCode && (
                  <p><strong>{language === 'ar' ? 'كود العضو:' : 'Member Code:'}</strong> {selectedVerification.subscriberCode}</p>
                )}
              </div>

              <div className="vm-detail-section">
                <h4>{language === 'ar' ? 'بيانات الهوية' : 'ID Details'}</h4>
                <p><strong>{language === 'ar' ? 'نوع الوثيقة:' : 'Document Type:'}</strong> {idTypeLabel(selectedVerification.idType)}</p>
                <p><strong>{language === 'ar' ? 'رقم الهوية:' : 'ID Number:'}</strong> {selectedVerification.idNumber}</p>
                <p><strong>{language === 'ar' ? 'الاسم الثلاثي:' : 'Full Name:'}</strong> {selectedVerification.fullName}</p>
                <p><strong>{language === 'ar' ? 'تاريخ الميلاد:' : 'Date of Birth:'}</strong> {new Date(selectedVerification.dateOfBirth).toLocaleDateString()}</p>
                <p><strong>{language === 'ar' ? 'تاريخ الطلب:' : 'Submitted:'}</strong> {new Date(selectedVerification.createdAt).toLocaleString()}</p>
              </div>

              <div className="vm-detail-section">
                <h4>{language === 'ar' ? 'صورة الهوية' : 'ID Image'}</h4>
                <img
                  src={selectedVerification.idImage}
                  alt="ID"
                  className="vm-id-image"
                  onClick={() => window.open(selectedVerification.idImage, '_blank')}
                />
                <small>{language === 'ar' ? 'اضغط على الصورة للتكبير' : 'Click image to enlarge'}</small>
              </div>

              {selectedVerification.status === 'rejected' && selectedVerification.adminNote && (
                <div className="vm-detail-section vm-rejected-section">
                  <h4>{language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</h4>
                  <p>{selectedVerification.adminNote}</p>
                </div>
              )}
            </div>

            {selectedVerification.status === 'pending' && (
              <div className="vm-detail-actions">
                <button
                  className="vm-approve-btn"
                  onClick={() => handleApprove(selectedVerification)}
                  disabled={actionLoading}
                >
                  ✓ {language === 'ar' ? 'قبول التوثيق' : 'Approve'}
                </button>
                <button
                  className="vm-reject-btn"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  ✕ {language === 'ar' ? 'رفض التوثيق' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Note Modal */}
      {showRejectModal && (
        <div className="verification-overlay">
          <div className="vm-reject-modal">
            <h3>{language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب سبب الرفض للعضو...' : 'Write rejection reason for the member...'}
              rows={4}
            />
            <div className="vm-reject-modal-actions">
              <button className="vm-reject-btn" onClick={handleRejectSubmit} disabled={actionLoading}>
                {language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </button>
              <button className="verification-cancel-btn" onClick={() => { setShowRejectModal(false); setRejectNote(''); }}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;
