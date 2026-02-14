import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffForm = ({ data, onChange, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="admin-form" style={{ marginBottom: '15px' }}>
    <div className="form-row">
      <div className="form-group">
        <label>اسم المستخدم *</label>
        <input type="text" name="username" value={data.username || ''} onChange={onChange} required disabled={isEdit} />
      </div>
      <div className="form-group">
        <label>الاسم الكامل *</label>
        <input type="text" name="name" value={data.name || ''} onChange={onChange} required />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>{isEdit ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور *'}</label>
        <input type="password" name="password" value={data.password || ''} onChange={onChange} required={!isEdit} />
      </div>
      <div className="form-group">
        <label>رقم الهاتف</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select name="countryCode" value={data.countryCode || '+970'} onChange={onChange} style={{ width: '100px' }}>
            {['+970', '+972', '+962', '+966', '+20', '+1'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="tel" name="phone" value={data.phone || ''} onChange={onChange} style={{ flex: 1 }} />
        </div>
      </div>
    </div>
    {isEdit && (
      <div className="form-group">
        <label>
          <input type="checkbox" name="isActive" checked={data.isActive !== false} onChange={(e) => onChange({ target: { name: 'isActive', value: e.target.checked } })} />
          {' '}الحساب نشط
        </label>
      </div>
    )}
    <button type="submit" className="submit-btn">{isEdit ? 'حفظ التعديلات' : 'إنشاء الحساب'}</button>
  </form>
);

const StaffManagement = () => {
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [adminSecretaries, setAdminSecretaries] = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(null); // 'sales' | 'secretary' | null
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({ username: '', password: '', name: '', phone: '', countryCode: '+970' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [empRes, secRes] = await Promise.all([
        axios.get('/api/admin/sales-employees', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/admin-secretaries', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSalesEmployees(empRes.data.data || []);
      setAdminSecretaries(secRes.data.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    if (editingStaff) {
      setEditingStaff({ ...editingStaff, [name]: value });
    } else {
      setNewStaff({ ...newStaff, [name]: value });
    }
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = editingStaff || newStaff;
    try {
      if (editingStaff) {
        await axios.put(`/api/admin/sales-employee/${editingStaff._id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/admin/sales-employee', data, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowStaffForm(null);
      setEditingStaff(null);
      setNewStaff({ username: '', password: '', name: '', phone: '', countryCode: '+970' });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.messageAr || 'حدث خطأ');
    }
  };

  const handleSecretarySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = editingStaff || newStaff;
    try {
      if (editingStaff) {
        await axios.put(`/api/admin/admin-secretary/${editingStaff._id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/admin/admin-secretary', data, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowStaffForm(null);
      setEditingStaff(null);
      setNewStaff({ username: '', password: '', name: '', phone: '', countryCode: '+970' });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.messageAr || 'حدث خطأ');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const token = localStorage.getItem('token');
    const url = type === 'sales' ? `/api/admin/sales-employee/${id}` : `/api/admin/admin-secretary/${id}`;
    try {
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.messageAr || 'حدث خطأ');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>جاري التحميل...</div>;

  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>👥 إدارة الموظفين</h3>

      {/* موظفو المبيعات */}
      <div style={{ marginBottom: '30px', background: '#f8f9fa', borderRadius: '12px', padding: '20px' }}>
        <div className="tab-header" style={{ marginBottom: '15px' }}>
          <h4>🛒 موظفو المبيعات</h4>
          <button className="add-btn" onClick={() => {
            setShowStaffForm(showStaffForm === 'sales' ? null : 'sales');
            setEditingStaff(null);
            setNewStaff({ username: '', password: '', name: '', phone: '', countryCode: '+970' });
          }}>
            {showStaffForm === 'sales' ? 'إلغاء' : '+ إضافة موظف مبيعات'}
          </button>
        </div>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>صلاحياته: إنشاء طلبيات للزبائن + إدارة الطلبات فقط</p>

        {showStaffForm === 'sales' && (
          <StaffForm
            data={editingStaff || newStaff}
            onChange={handleStaffChange}
            onSubmit={handleSalesSubmit}
            isEdit={!!editingStaff}
          />
        )}

        <table className="admin-table" style={{ marginTop: '10px' }}>
          <thead>
            <tr><th>الاسم</th><th>المستخدم</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {salesEmployees.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>لا يوجد موظفو مبيعات</td></tr>
            ) : salesEmployees.map(emp => (
              <tr key={emp._id}>
                <td>{emp.name}</td>
                <td>{emp.username}</td>
                <td>{emp.phone || '-'}</td>
                <td><span style={{ color: emp.isActive !== false ? '#27ae60' : '#e74c3c' }}>{emp.isActive !== false ? '✅ نشط' : '🚫 موقوف'}</span></td>
                <td>
                  <button className="edit-btn" onClick={() => { setEditingStaff(emp); setShowStaffForm('sales'); }}>تعديل</button>
                  <button className="delete-btn" style={{ marginRight: '5px' }} onClick={() => handleDelete(emp._id, 'sales')}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* سكرتارية الإدارة */}
      <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px' }}>
        <div className="tab-header" style={{ marginBottom: '15px' }}>
          <h4>📋 سكرتارية الإدارة</h4>
          <button className="add-btn" onClick={() => {
            setShowStaffForm(showStaffForm === 'secretary' ? null : 'secretary');
            setEditingStaff(null);
            setNewStaff({ username: '', password: '', name: '', phone: '', countryCode: '+970' });
          }}>
            {showStaffForm === 'secretary' ? 'إلغاء' : '+ إضافة سكرتير'}
          </button>
        </div>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>صلاحياته: إدارة المستخدمين وتغيير كود الراعي فقط</p>

        {showStaffForm === 'secretary' && (
          <StaffForm
            data={editingStaff || newStaff}
            onChange={handleStaffChange}
            onSubmit={handleSecretarySubmit}
            isEdit={!!editingStaff}
          />
        )}

        <table className="admin-table" style={{ marginTop: '10px' }}>
          <thead>
            <tr><th>الاسم</th><th>المستخدم</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {adminSecretaries.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>لا يوجد سكرتارية إدارة</td></tr>
            ) : adminSecretaries.map(sec => (
              <tr key={sec._id}>
                <td>{sec.name}</td>
                <td>{sec.username}</td>
                <td>{sec.phone || '-'}</td>
                <td><span style={{ color: sec.isActive !== false ? '#27ae60' : '#e74c3c' }}>{sec.isActive !== false ? '✅ نشط' : '🚫 موقوف'}</span></td>
                <td>
                  <button className="edit-btn" onClick={() => { setEditingStaff(sec); setShowStaffForm('secretary'); }}>تعديل</button>
                  <button className="delete-btn" style={{ marginRight: '5px' }} onClick={() => handleDelete(sec._id, 'secretary')}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagement;
