import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Admin.css';

const MembersManagement = () => {
  const { language } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    sponsorCode: '',
    commissionRate: 10,
    isActive: true
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      // Filter only members
      const membersOnly = data.users.filter(user => user.role === 'member');
      setMembers(membersOnly);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setEditForm({
      sponsorCode: member.sponsorId?.subscriberCode || '',
      commissionRate: member.commissionRate || 10,
      isActive: member.isActive !== false
    });
  };

  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditForm({ ...editForm, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        commissionRate: Number(editForm.commissionRate),
        isActive: editForm.isActive
      };

      // If sponsor code changed
      if (editForm.sponsorCode && editForm.sponsorCode !== editingMember.sponsorId?.subscriberCode) {
        updateData.newSponsorCode = editForm.sponsorCode;
      }

      await updateUser(editingMember._id, updateData);
      setEditingMember(null);
      fetchMembers();
      alert(language === 'ar' ? 'تم تحديث بيانات العضو بنجاح' : 'Member updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      alert(error.response?.data?.message || (language === 'ar' ? 'فشل في تحديث بيانات العضو' : 'Failed to update member'));
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>{language === 'ar' ? 'إدارة الأعضاء' : 'Members Management'}</h2>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="modal-overlay" onClick={() => setEditingMember(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{language === 'ar' ? 'تعديل بيانات العضو' : 'Edit Member'}: {editingMember.name}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{language === 'ar' ? 'كود العضو' : 'Member Code'}</label>
                <input
                  type="text"
                  value={editingMember.subscriberCode || '-'}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'كود الراعي الجديد' : 'New Sponsor Code'}</label>
                <input
                  type="text"
                  name="sponsorCode"
                  value={editForm.sponsorCode}
                  onChange={handleEditChange}
                  placeholder={language === 'ar' ? 'أدخل كود الراعي الجديد' : 'Enter new sponsor code'}
                />
                <small>
                  {language === 'ar' ? 'الراعي الحالي: ' : 'Current Sponsor: '}
                  {editingMember.sponsorId?.name || (language === 'ar' ? 'لا يوجد' : 'None')}
                  {editingMember.sponsorId?.subscriberCode ? ` (${editingMember.sponsorId.subscriberCode})` : ''}
                </small>
              </div>
              <div className="form-group">
                <label>{language === 'ar' ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}</label>
                <input
                  type="number"
                  name="commissionRate"
                  value={editForm.commissionRate}
                  onChange={handleEditChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditChange}
                  />
                  {language === 'ar' ? 'نشط' : 'Active'}
                </label>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditingMember(null)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
              <th>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
              <th>{language === 'ar' ? 'كود العضو' : 'Member Code'}</th>
              <th>{language === 'ar' ? 'الدولة' : 'Country'}</th>
              <th>{language === 'ar' ? 'المدينة' : 'City'}</th>
              <th>{language === 'ar' ? 'الراعي' : 'Sponsor'}</th>
              <th>{language === 'ar' ? 'كود الراعي' : 'Sponsor Code'}</th>
              <th>{language === 'ar' ? 'نسبة العمولة' : 'Commission'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member._id}>
                <td>{member.name}</td>
                <td>{member.username}</td>
                <td><strong>{member.subscriberCode || '-'}</strong></td>
                <td>{member.country || '-'}</td>
                <td>{member.city || '-'}</td>
                <td>{member.sponsorId?.name || (language === 'ar' ? 'لا يوجد' : 'None')}</td>
                <td>{member.sponsorId?.subscriberCode || '-'}</td>
                <td>{member.commissionRate}%</td>
                <td>
                  <span className={`status ${member.isActive !== false ? 'active' : 'inactive'}`}>
                    {member.isActive !== false
                      ? (language === 'ar' ? 'نشط' : 'Active')
                      : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(member)} className="edit-btn">
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && members.length === 0 && (
        <div className="no-data">
          {language === 'ar' ? 'لا يوجد أعضاء حالياً.' : 'No members found.'}
        </div>
      )}
    </div>
  );
};

export default MembersManagement;
