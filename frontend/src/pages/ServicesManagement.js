import React, { useState, useEffect } from 'react';
import { getAllServices, createService, deleteService, getAllServiceUsage, reviewServiceUsage } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Admin.css';

const ServicesManagement = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [serviceUsages, setServiceUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedInvoiceImages, setSelectedInvoiceImages] = useState([]);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    discountPercentage: '',
    pointsPercentage: '',
    facebook: '',
    instagram: '',
    twitter: '',
    website: ''
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
          twitter: newService.twitter,
          website: newService.website
        },
        images: selectedImages
      };

      await createService(serviceData);
      setShowServiceForm(false);
      setNewService({
        name: '',
        description: '',
        category: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        address: '',
        discountPercentage: '',
        pointsPercentage: '',
        facebook: '',
        instagram: '',
        twitter: '',
        website: ''
      });
      setSelectedImages([]);
      fetchData();
      alert(language === 'ar' ? 'تم إضافة الخدمة بنجاح' : 'Service added successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      alert(language === 'ar' ? 'فشل إضافة الخدمة' : 'Failed to add service');
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
    const files = Array.from(e.target.files);
    setSelectedImages(files);
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

      <div className="admin-tabs">
        <button
          className={activeTab === 'services' ? 'tab-active' : ''}
          onClick={() => setActiveTab('services')}
        >
          {language === 'ar' ? 'الخدمات' : 'Services'}
        </button>
        <button
          className={activeTab === 'usage' ? 'tab-active' : ''}
          onClick={() => setActiveTab('usage')}
        >
          {language === 'ar' ? 'طلبات الاستخدام' : 'Usage Requests'}
        </button>
      </div>

      {loading ? (
        <div className="loading">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'services' && (
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

                  <h4>{language === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h4>
                  <div className="form-grid">
                    <input
                      type="text"
                      name="ownerName"
                      placeholder={language === 'ar' ? 'اسم المالك' : 'Owner Name'}
                      value={newService.ownerName}
                      onChange={handleServiceChange}
                      required
                    />
                    <input
                      type="tel"
                      name="ownerPhone"
                      placeholder={language === 'ar' ? 'هاتف المالك' : 'Owner Phone'}
                      value={newService.ownerPhone}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="email"
                      name="ownerEmail"
                      placeholder={language === 'ar' ? 'بريد المالك' : 'Owner Email'}
                      value={newService.ownerEmail}
                      onChange={handleServiceChange}
                    />
                  </div>

                  <h4>{language === 'ar' ? 'العنوان' : 'Address'}</h4>
                  <textarea
                    name="address"
                    placeholder={language === 'ar' ? 'العنوان الكامل' : 'Full Address'}
                    value={newService.address}
                    onChange={handleServiceChange}
                    required
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
                      name="twitter"
                      placeholder="Twitter URL"
                      value={newService.twitter}
                      onChange={handleServiceChange}
                    />
                    <input
                      type="url"
                      name="website"
                      placeholder={language === 'ar' ? 'الموقع الإلكتروني' : 'Website URL'}
                      value={newService.website}
                      onChange={handleServiceChange}
                    />
                  </div>

                  <h4>{language === 'ar' ? 'صور الخدمة' : 'Service Images'}</h4>
                  <div className="form-group">
                    <label>{language === 'ar' ? 'اختر صور الخدمة (حتى 5 صور)' : 'Select Service Images (up to 5)'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleServiceImagesChange}
                    />
                    {selectedImages.length > 0 && (
                      <p>{language === 'ar' ? `تم اختيار ${selectedImages.length} صورة` : `${selectedImages.length} image(s) selected`}</p>
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
                    <th>{language === 'ar' ? 'المالك' : 'Owner'}</th>
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
                      <td>{service.ownerName}</td>
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
                        <button onClick={() => handleDeleteService(service._id)} className="delete-btn">
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'usage' && (
            <div>
              <h3>{language === 'ar' ? 'طلبات استخدام الخدمات' : 'Service Usage Requests'}</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th>{language === 'ar' ? 'العضو' : 'Member'}</th>
                    <th>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th>{language === 'ar' ? 'النقاط المكتسبة' : 'Points Earned'}</th>
                    <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th>{language === 'ar' ? 'الفاتورة' : 'Receipt'}</th>
                    <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceUsages.map((usage) => (
                    <tr key={usage._id}>
                      <td>{usage.service?.name || 'N/A'}</td>
                      <td>{usage.user?.name || 'N/A'}</td>
                      <td>${usage.invoiceAmount}</td>
                      <td>{usage.pointsEarned} {language === 'ar' ? 'نقطة' : 'pts'}</td>
                      <td>{new Date(usage.invoiceDate).toLocaleDateString()}</td>
                      <td>
                        {usage.receiptImage ? (
                          <button
                            className="view-btn"
                            onClick={() => handleImageClick(usage.receiptImage)}
                          >
                            {language === 'ar' ? 'عرض' : 'View'}
                          </button>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <span className={`status ${usage.status}`}>
                          {usage.status === 'pending' && (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                          {usage.status === 'approved' && (language === 'ar' ? 'مقبول' : 'Approved')}
                          {usage.status === 'rejected' && (language === 'ar' ? 'مرفوض' : 'Rejected')}
                        </span>
                      </td>
                      <td>
                        {usage.status === 'pending' && (
                          <div>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                              <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                                {language === 'ar' ? 'صور الفاتورة (اختياري)' : 'Invoice Images (Optional)'}
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleInvoiceImagesChange}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleReviewUsage(usage._id, 'approved')}
                                className="approve-btn"
                              >
                                {language === 'ar' ? 'قبول' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReviewUsage(usage._id, 'rejected')}
                                className="reject-btn"
                              >
                                {language === 'ar' ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        )}
                        {usage.status !== 'pending' && (
                          <span>{language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
