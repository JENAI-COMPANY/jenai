import React, { useState, useEffect } from 'react';
import { getAllServices, createService, updateService, deleteService, getAllServiceUsage, reviewServiceUsage } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Admin.css';

const ServicesManagement = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [serviceUsages, setServiceUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedInvoiceImages, setSelectedInvoiceImages] = useState([]);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    discountPercentage: '',
    pointsPercentage: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    whatsapp: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const data = await getAllServices();
        setServices(data.data);
      } else if (activeTab === 'usage') {
        const data = await getAllServiceUsage();
        setServiceUsages(data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...newService,
        socialMedia: {
          facebook: newService.facebook,
          instagram: newService.instagram,
          tiktok: newService.tiktok,
          whatsapp: newService.whatsapp,
          phone: newService.phone
        },
        images: selectedImages
      };

      await createService(serviceData);
      setShowServiceForm(false);
      setNewService({
        name: '',
        description: '',
        category: '',
        address: '',
        discountPercentage: '',
        pointsPercentage: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        whatsapp: '',
        phone: ''
      });
      setSelectedImages([]);
      fetchData();
      alert(language === 'ar' ? 'تم إضافة الخدمة بنجاح' : 'Service added successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      alert(language === 'ar' ? 'فشل إضافة الخدمة' : 'Failed to add service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditImages([]);
    setEditForm({
      name: service.name || '',
      description: service.description || '',
      category: service.category || '',
      address: service.address || '',
      discountPercentage: service.discountPercentage || '',
      pointsPercentage: service.pointsPercentage || '',
      isActive: service.isActive !== false,
      facebook: service.socialMedia?.facebook || '',
      instagram: service.socialMedia?.instagram || '',
      tiktok: service.socialMedia?.tiktok || '',
      whatsapp: service.socialMedia?.whatsapp || '',
      phone: service.socialMedia?.phone || ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({ ...editForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...editForm,
        socialMedia: {
          facebook: editForm.facebook,
          instagram: editForm.instagram,
          tiktok: editForm.tiktok,
          whatsapp: editForm.whatsapp,
          phone: editForm.phone
        },
        ...(editImages.length > 0 && { images: editImages })
      };
      await updateService(editingService._id, serviceData);
      setEditingService(null);
      fetchData();
      alert(language === 'ar' ? 'تم تحديث الخدمة بنجاح' : 'Service updated successfully');
    } catch (error) {
      console.error('Error updating service:', error);
      alert(language === 'ar' ? 'فشل تحديث الخدمة' : 'Failed to update service');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الخدمة؟' : 'Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
        fetchData();
        alert(language === 'ar' ? 'تم حذف الخدمة بنجاح' : 'Service deleted successfully');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert(language === 'ar' ? 'فشل حذف الخدمة' : 'Failed to delete service');
      }
    }
  };

  const handleReviewUsage = async (usageId, status) => {
    try {
      await reviewServiceUsage(usageId, {
        status,
        invoiceImages: selectedInvoiceImages
      });
      setSelectedInvoiceImages([]);
      fetchData();
      alert(language === 'ar'
        ? `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`
        : `Usage ${status} successfully`);
    } catch (error) {
      console.error('Error reviewing usage:', error);
      alert(language === 'ar' ? 'فشل مراجعة الطلب' : 'Failed to review usage');
    }
  };

  const handleServiceImagesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleInvoiceImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedInvoiceImages(files);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="admin-container">
      <h2>{language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}</h2>


      {loading ? (
        <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div className="tab-content">
          <div>
              <div className="tab-header">
                <h3>{language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}</h3>
                <button onClick={() => setShowServiceForm(!showServiceForm)} className="add-btn">
                  {showServiceForm
                    ? (language === 'ar' ? 'إلغاء' : 'Cancel')
                    : (language === 'ar' ? 'إضافة خدمة' : 'Add Service')}
                </button>
              </div>

              {showServiceForm && (
                <form onSubmit={handleCreateService} className="product-form" autoComplete="off">
                  <h4>{language === 'ar' ? 'معلومات الخدمة الأساسية' : 'Basic Service Information'}</h4>
                  <div className="form-grid">
                    <input
                      type="text"
                      name="name"
                      placeholder={language === 'ar' ? 'اسم الخدمة' : 'Service Name'}
                      value={newService.name}
                      onChange={handleServiceChange}
                      required
                    />
                    <input
                      type="text"
                      name="category"
                      placeholder={language === 'ar' ? 'الفئة' : 'Category'}
                      value={newService.category}
                      onChange={handleServiceChange}
                      required
                    />
                  </div>
                  <textarea
                    name="description"
                    placeholder={language === 'ar' ? 'وصف الخدمة' : 'Service Description'}
                    value={newService.description}
                    onChange={handleServiceChange}
                    required
                  />

                  <h4>{language === 'ar' ? 'العنوان' : 'Address'}</h4>
                  <textarea
                    name="address"
                    placeholder={language === 'ar' ? 'العنوان الكامل' : 'Full Address'}
                    value={newService.address}
                    onChange={handleServiceChange}
                  />

                  <h4>{language === 'ar' ? 'نسب الخصم والنقاط' : 'Discount & Points Percentages'}</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{language === 'ar' ? 'نسبة الخصم % (للإدارة فقط)' : 'Discount % (Admin Only)'}</label>
                      <input
                        type="number"
                        name="discountPercentage"
                        placeholder={language === 'ar' ? 'نسبة الخصم' : 'Discount Percentage'}
                        value={newService.discountPercentage}
                        onChange={handleServiceChange}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{language === 'ar' ? 'نسبة النقاط % (للأعضاء)' : 'Points % (For Members)'}</label>
                      <input
                        type="number"
                        name="pointsPercentage"
                        placeholder={language === 'ar' ? 'نسبة النقاط' : 'Points Percentage'}
                        value={newService.pointsPercentage}
                        onChange={handleServiceChange}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>

                  <h4>{language === 'ar' ? 'صفحات السوشيال ميديا' : 'Social Media Pages'}</h4>
                  <div className="form-grid">
                    <input
                      type="url"
                      name="facebook"
                      placeholder="Facebook URL"
                      value={newService.facebook}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="url"
                      name="instagram"
                      placeholder="Instagram URL"
                      value={newService.instagram}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="url"
                      name="tiktok"
                      placeholder="TikTok URL"
                      value={newService.tiktok}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="text"
                      name="whatsapp"
                      placeholder={language === 'ar' ? 'رقم واتساب' : 'WhatsApp Number'}
                      value={newService.whatsapp}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      value={newService.phone}
                      onChange={handleServiceChange}
                    />
                  </div>

                  <h4>{language === 'ar' ? 'صور وفيديوهات الخدمة' : 'Service Images & Videos'}</h4>
                  <div className="form-group">
                    <label>{language === 'ar' ? 'اختر صور وفيديوهات الخدمة' : 'Select Service Images & Videos'}</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleServiceImagesChange}
                    />
                    {selectedImages.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#16a34a' }}>{selectedImages.length} {language === 'ar' ? 'ملف محدد' : 'file(s) selected'}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedImages.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                              <button type="button" onClick={() => setSelectedImages(prev => prev.filter((_, j) => j !== i))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginRight: 4, fontWeight: 'bold', fontSize: 14 }}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="submit-btn">
                    {language === 'ar' ? 'إضافة الخدمة' : 'Create Service'}
                  </button>
                </form>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                    <th>{language === 'ar' ? 'الخصم %' : 'Discount %'}</th>
                    <th>{language === 'ar' ? 'النقاط %' : 'Points %'}</th>
                    <th>{language === 'ar' ? 'مرات الاستخدام' : 'Total Usage'}</th>
                    <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service._id}>
                      <td>{service.name}</td>
                      <td>{service.category}</td>
                      <td>{service.discountPercentage}%</td>
                      <td>{service.pointsPercentage}%</td>
                      <td>{service.totalUsage || 0}</td>
                      <td>
                        <span className={`status ${service.isActive ? 'active' : 'inactive'}`}>
                          {service.isActive
                            ? (language === 'ar' ? 'نشط' : 'Active')
                            : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditService(service)} className="edit-btn" style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button onClick={() => handleDeleteService(service._id)} className="delete-btn">
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {false && (
            <div>
              <table className="data-table">
                <thead><tr><th></th></tr></thead>
                <tbody>
                  {serviceUsages.map((usage) => (
                    <tr key={usage._id}>
                      <td>
                        <span>
                          {usage.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="modal-overlay" onClick={() => setEditingService(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '12px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{language === 'ar' ? 'تعديل الخدمة' : 'Edit Service'}</h3>
              <button onClick={() => setEditingService(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateService} className="product-form" autoComplete="off">
              <h4>{language === 'ar' ? 'معلومات الخدمة الأساسية' : 'Basic Service Information'}</h4>
              <div className="form-grid">
                <input type="text" name="name" placeholder={language === 'ar' ? 'اسم الخدمة' : 'Service Name'} value={editForm.name} onChange={handleEditFormChange} required />
                <input type="text" name="category" placeholder={language === 'ar' ? 'الفئة' : 'Category'} value={editForm.category} onChange={handleEditFormChange} required />
              </div>
              <textarea name="description" placeholder={language === 'ar' ? 'وصف الخدمة' : 'Service Description'} value={editForm.description} onChange={handleEditFormChange} required />

              <h4>{language === 'ar' ? 'العنوان' : 'Address'}</h4>
              <textarea name="address" placeholder={language === 'ar' ? 'العنوان الكامل' : 'Full Address'} value={editForm.address} onChange={handleEditFormChange} />

              <h4>{language === 'ar' ? 'نسب الخصم والنقاط' : 'Discount & Points Percentages'}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>{language === 'ar' ? 'نسبة الخصم %' : 'Discount %'}</label>
                  <input type="number" name="discountPercentage" value={editForm.discountPercentage} onChange={handleEditFormChange} min="0" max="100" required />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'نسبة النقاط %' : 'Points %'}</label>
                  <input type="number" name="pointsPercentage" value={editForm.pointsPercentage} onChange={handleEditFormChange} min="0" max="100" required />
                </div>
              </div>

              <h4>{language === 'ar' ? 'صفحات السوشيال ميديا' : 'Social Media Pages'}</h4>
              <div className="form-grid">
                <input type="url" name="facebook" placeholder="Facebook URL" value={editForm.facebook} onChange={handleEditFormChange} />
                <input type="url" name="instagram" placeholder="Instagram URL" value={editForm.instagram} onChange={handleEditFormChange} />
                <input type="url" name="tiktok" placeholder="TikTok URL" value={editForm.tiktok} onChange={handleEditFormChange} />
                <input type="text" name="whatsapp" placeholder={language === 'ar' ? 'رقم واتساب' : 'WhatsApp Number'} value={editForm.whatsapp} onChange={handleEditFormChange} />
                <input type="tel" name="phone" placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} value={editForm.phone || ''} onChange={handleEditFormChange} />
              </div>

              <h4>{language === 'ar' ? 'الحالة' : 'Status'}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditFormChange}
                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                  />
                  {language === 'ar' ? 'الخدمة نشطة' : 'Service Active'}
                </label>
                <span style={{ color: editForm.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                  {editForm.isActive ? (language === 'ar' ? '✓ نشط' : '✓ Active') : (language === 'ar' ? '✗ غير نشط' : '✗ Inactive')}
                </span>
              </div>

              <h4>{language === 'ar' ? 'تحديث صور الخدمة' : 'Update Service Images'}</h4>
              {editingService?.images?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {editingService.images.map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  ))}
                </div>
              )}
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {language === 'ar' ? 'اختر صوراً جديدة (ستستبدل الحالية)' : 'Select new images (replaces current)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => { setEditImages(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }}
                />
                {editImages.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '0.25rem' }}>
                    {language === 'ar' ? `تم اختيار ${editImages.length} صورة` : `${editImages.length} image(s) selected`}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingService(null)} className="cancel-btn" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeImageModal}>&times;</span>
            <img src={selectedImage} alt="Receipt" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
