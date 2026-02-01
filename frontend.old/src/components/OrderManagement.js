import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import '../styles/OrderManagement.css';

const OrderManagement = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    confirmedPrice: '',
    requestedDeliveryDate: '',
    adminResponse: '',
    additionalNotes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(language === 'ar' ? 'تم تحديث حالة الطلب بنجاح!' : 'Order status updated successfully!');
      fetchOrders();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleConfirmSpecs = async () => {
    console.log('🚀 handleConfirmSpecs called');
    console.log('📝 Confirm data:', confirmData);
    console.log('📦 Selected order:', selectedOrder);

    try {
      if (!confirmData.confirmedPrice || parseFloat(confirmData.confirmedPrice) <= 0) {
        console.log('❌ Validation failed: price invalid');
        setError(language === 'ar' ? 'السعر المؤكد مطلوب ويجب أن يكون أكبر من صفر' : 'Confirmed price is required and must be greater than 0');
        setTimeout(() => setError(''), 3000);
        return;
      }

      console.log('✅ Validation passed, sending request...');
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('🔑 Token exists:', !!token);
      console.log('👤 User:', user ? JSON.parse(user) : 'No user');
      console.log('🌐 Request URL:', `/api/orders/${selectedOrder._id}/confirm-specs`);
      console.log('📤 Request data:', confirmData);

      const response = await axios.put(
        `/api/orders/${selectedOrder._id}/confirm-specs`,
        confirmData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Response received:', response.data);

      setMessage(language === 'ar' ? 'تم تأكيد مواصفات الطلب المخصص بنجاح!' : 'Custom order specifications confirmed successfully!');
      setShowConfirmModal(false);
      setConfirmData({
        confirmedPrice: '',
        requestedDeliveryDate: '',
        adminResponse: '',
        additionalNotes: ''
      });
      fetchOrders();
      setSelectedOrder(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('❌ Error confirming specs:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.messageAr || 'Failed to confirm specifications');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openConfirmModal = (order) => {
    console.log('🎨 Opening confirm modal for order:', order.orderNumber);
    console.log('📋 Custom order details:', order.customOrderDetails);
    setSelectedOrder(order);
    setConfirmData({
      confirmedPrice: order.customOrderDetails?.confirmedPrice || '',
      requestedDeliveryDate: order.customOrderDetails?.requestedDeliveryDate || '',
      adminResponse: order.customOrderDetails?.adminResponse || '',
      additionalNotes: order.customOrderDetails?.additionalNotes || ''
    });
    setShowConfirmModal(true);
    console.log('✅ Modal state set to true');
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'om-status-pending',
      prepared: 'om-status-prepared',
      on_the_way: 'om-status-on-way',
      received: 'om-status-received'
    };
    return statusMap[status] || 'om-status-pending';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      prepared: language === 'ar' ? 'جاهز' : 'Prepared',
      on_the_way: language === 'ar' ? 'في الطريق' : 'On The Way',
      received: language === 'ar' ? 'تم الاستلام' : 'Received'
    };
    return statusLabels[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.username?.toLowerCase().includes(searchLower) ||
      order.user?.subscriberCode?.toLowerCase().includes(searchLower) ||
      order.user?.nationalId?.includes(searchTerm) ||
      order.user?.phone?.includes(searchTerm) ||
      order.contactPhone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesType = filterType === 'all' ||
      (filterType === 'custom' && order.isCustomOrder) ||
      (filterType === 'standard' && !order.isCustomOrder);
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="order-management loading">
        <div className="om-spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading orders...'}</p>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="om-header">
        <h2>{language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}</h2>
        <p className="om-subtitle">
          {language === 'ar' ? 'تتبع وإدارة جميع الطلبات' : 'Track and manage all orders'}
        </p>
      </div>

      {error && <div className="om-alert om-alert-error">{error}</div>}
      {message && <div className="om-alert om-alert-success">{message}</div>}

      {/* Filters */}
      <div className="om-filters">
        <div className="om-search">
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث برقم الطلب، الاسم، اليوزر، رقم العضوية، الهوية أو الهاتف...' : 'Search by order number, name, username, member ID, national ID or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="om-filter-select">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
            <option value="prepared">{language === 'ar' ? 'جاهز' : 'Prepared'}</option>
            <option value="on_the_way">{language === 'ar' ? 'في الطريق' : 'On The Way'}</option>
            <option value="received">{language === 'ar' ? 'تم الاستلام' : 'Received'}</option>
          </select>
        </div>
        <div className="om-filter-select">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            <option value="custom">🎨 {language === 'ar' ? 'طلبات مخصصة' : 'Custom Orders'}</option>
            <option value="standard">📦 {language === 'ar' ? 'طلبات عادية' : 'Standard Orders'}</option>
          </select>
        </div>
      </div>

      {/* Orders Stats */}
      <div className="om-stats">
        <div className="om-stat-card">
          <h3>{orders.length}</h3>
          <p>{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
        </div>
        <div className="om-stat-card om-stat-custom">
          <h3>{orders.filter(o => o.isCustomOrder).length}</h3>
          <p>🎨 {language === 'ar' ? 'طلبات مخصصة' : 'Custom Orders'}</p>
        </div>
        <div className="om-stat-card">
          <h3>{orders.filter(o => o.status === 'pending').length}</h3>
          <p>{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p>
        </div>
        <div className="om-stat-card">
          <h3>{orders.filter(o => o.status === 'prepared').length}</h3>
          <p>{language === 'ar' ? 'جاهز' : 'Prepared'}</p>
        </div>
        <div className="om-stat-card">
          <h3>{orders.filter(o => o.status === 'on_the_way').length}</h3>
          <p>{language === 'ar' ? 'في الطريق' : 'On The Way'}</p>
        </div>
        <div className="om-stat-card">
          <h3>{orders.filter(o => o.status === 'received').length}</h3>
          <p>{language === 'ar' ? 'تم الاستلام' : 'Received'}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="om-table-wrapper">
        <table className="om-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
              <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
              <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
              <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
              <th>{language === 'ar' ? 'المبلغ' : 'Total'}</th>
              <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
              <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
              <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="om-no-data">
                  {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order._id} className={order.isCustomOrder ? 'om-custom-order-row' : ''}>
                  <td className="om-order-number">{order.orderNumber}</td>
                  <td>{order.user?.name || 'N/A'}</td>
                  <td>{order.contactPhone}</td>
                  <td>
                    {order.isCustomOrder ? (
                      <span className="om-custom-badge">
                        🎨 {language === 'ar' ? 'مخصص' : 'Custom'}
                      </span>
                    ) : (
                      <span className="om-standard-badge">
                        📦 {language === 'ar' ? 'عادي' : 'Standard'}
                      </span>
                    )}
                  </td>
                  <td className="om-price">${order.totalPrice?.toFixed(2)}</td>
                  <td>
                    <select
                      className={`om-status-badge ${getStatusBadgeClass(order.status)}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                      <option value="prepared">{language === 'ar' ? 'جاهز' : 'Prepared'}</option>
                      <option value="on_the_way">{language === 'ar' ? 'في الطريق' : 'On The Way'}</option>
                      <option value="received">{language === 'ar' ? 'تم الاستلام' : 'Received'}</option>
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="om-view-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="om-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="om-modal" onClick={(e) => e.stopPropagation()}>
            <div className="om-modal-header">
              <h3>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
              <button className="om-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="om-modal-body">
              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'معلومات الطلب' : 'Order Information'}</h4>
                <p><strong>{language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> {selectedOrder.orderNumber}</p>
                <p><strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong> <span className={`om-status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>{getStatusLabel(selectedOrder.status)}</span></p>
                <p><strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'معلومات العميل' : 'Customer Information'}</h4>
                <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {selectedOrder.user?.name}</p>
                <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {selectedOrder.contactPhone}</p>
                {selectedOrder.alternatePhone && (
                  <p><strong>{language === 'ar' ? 'هاتف بديل:' : 'Alternate Phone:'}</strong> {selectedOrder.alternatePhone}</p>
                )}
                <p><strong>{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</strong> {
                  selectedOrder.paymentMethod === 'cash_on_delivery' ? (language === 'ar' ? 'الدفع عند التوصيل' : 'Cash on Delivery') :
                  selectedOrder.paymentMethod === 'cash_at_company' ? (language === 'ar' ? 'كاش بالشركة' : 'Cash at Company') :
                  selectedOrder.paymentMethod === 'reflect' ? (language === 'ar' ? 'ريفليكت' : 'Reflect') :
                  selectedOrder.paymentMethod
                }</p>
              </div>

              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h4>
                <p>{selectedOrder.shippingAddress?.street}</p>
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                <p>{selectedOrder.shippingAddress?.country}</p>
              </div>

              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'المنتجات' : 'Products'}</h4>
                <table className="om-products-table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'المنتج' : 'Product'}</th>
                      <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                      <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h4>
                <p><strong>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</strong> ${selectedOrder.itemsPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الشحن:' : 'Shipping:'}</strong> ${selectedOrder.shippingPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الضريبة:' : 'Tax:'}</strong> ${selectedOrder.taxPrice?.toFixed(2)}</p>
                {selectedOrder.discountAmount > 0 && (
                  <p><strong>{language === 'ar' ? 'الخصم:' : 'Discount:'}</strong> -${selectedOrder.discountAmount?.toFixed(2)}</p>
                )}
                <p className="om-total"><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> ${selectedOrder.totalPrice?.toFixed(2)}</p>
              </div>

              {/* قسم الطلب المخصص */}
              {selectedOrder.isCustomOrder && selectedOrder.customOrderDetails && (
                <div className="om-detail-section om-custom-order-section">
                  <h4>🎨 {language === 'ar' ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h4>

                  <div className="om-custom-field">
                    <strong>{language === 'ar' ? '📝 المواصفات المطلوبة:' : '📝 Specifications:'}</strong>
                    <p className="om-specifications">{selectedOrder.customOrderDetails.specifications}</p>
                  </div>

                  {selectedOrder.customOrderDetails.requestedDeliveryDate && (
                    <div className="om-custom-field">
                      <strong>{language === 'ar' ? '📅 موعد التسليم المطلوب:' : '📅 Requested Delivery Date:'}</strong>
                      <p>{new Date(selectedOrder.customOrderDetails.requestedDeliveryDate).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.additionalNotes && (
                    <div className="om-custom-field">
                      <strong>{language === 'ar' ? '📋 ملاحظات إضافية:' : '📋 Additional Notes:'}</strong>
                      <p>{selectedOrder.customOrderDetails.additionalNotes}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.confirmedPrice && (
                    <div className="om-custom-field">
                      <strong>{language === 'ar' ? '💰 السعر المؤكد:' : '💰 Confirmed Price:'}</strong>
                      <p className="om-confirmed-price">${selectedOrder.customOrderDetails.confirmedPrice?.toFixed(2)}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.adminResponse && (
                    <div className="om-custom-field">
                      <strong>{language === 'ar' ? '💬 رد الإدارة:' : '💬 Admin Response:'}</strong>
                      <p>{selectedOrder.customOrderDetails.adminResponse}</p>
                    </div>
                  )}

                  <div className="om-custom-status">
                    {selectedOrder.customOrderDetails.isConfirmed ? (
                      <span className="om-confirmed">✅ {language === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed'}</span>
                    ) : (
                      <>
                        <span className="om-pending-confirm">⏳ {language === 'ar' ? 'بانتظار التأكيد' : 'Pending Confirmation'}</span>
                        <button
                          className="om-confirm-btn"
                          onClick={() => openConfirmModal(selectedOrder)}
                        >
                          {language === 'ar' ? 'تأكيد المواصفات' : 'Confirm Specifications'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="om-detail-section">
                  <h4>{language === 'ar' ? 'ملاحظات العميل' : 'Customer Notes'}</h4>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.adminNotes && (
                <div className="om-detail-section">
                  <h4>{language === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes'}</h4>
                  <p>{selectedOrder.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Specifications Modal */}
      {showConfirmModal && selectedOrder && (
        <div className="om-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="om-modal om-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="om-modal-header">
              <h3>🎨 {language === 'ar' ? 'تأكيد مواصفات الطلب المخصص' : 'Confirm Custom Order Specifications'}</h3>
              <button className="om-modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>
            <div className="om-modal-body">
              <div className="om-detail-section">
                <h4>{language === 'ar' ? 'معلومات الطلب' : 'Order Information'}</h4>
                <p><strong>{language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> {selectedOrder.orderNumber}</p>
                <p><strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {selectedOrder.user?.name}</p>
              </div>

              <div className="om-detail-section">
                <h4>{language === 'ar' ? '📝 المواصفات المطلوبة من العميل' : '📝 Customer Requested Specifications'}</h4>
                <div className="om-customer-specs">
                  <p>{selectedOrder.customOrderDetails?.specifications}</p>
                  {selectedOrder.customOrderDetails?.additionalNotes && (
                    <p className="om-additional-notes"><strong>{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> {selectedOrder.customOrderDetails.additionalNotes}</p>
                  )}
                  {selectedOrder.customOrderDetails?.requestedDeliveryDate && (
                    <p><strong>{language === 'ar' ? 'موعد التسليم المطلوب:' : 'Requested Delivery:'}</strong> {new Date(selectedOrder.customOrderDetails.requestedDeliveryDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="om-form-section">
                <div className="om-form-group">
                  <label>{language === 'ar' ? '💰 السعر المؤكد *' : '💰 Confirmed Price *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirmData.confirmedPrice}
                    onChange={(e) => setConfirmData({...confirmData, confirmedPrice: e.target.value})}
                    placeholder={language === 'ar' ? 'أدخل السعر المؤكد' : 'Enter confirmed price'}
                    required
                  />
                </div>

                <div className="om-form-group">
                  <label>{language === 'ar' ? '📅 موعد التسليم المطلوب' : '📅 Requested Delivery Date'}</label>
                  <input
                    type="date"
                    value={confirmData.requestedDeliveryDate ? new Date(confirmData.requestedDeliveryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setConfirmData({...confirmData, requestedDeliveryDate: e.target.value})}
                  />
                </div>

                <div className="om-form-group">
                  <label>{language === 'ar' ? '💬 رد الإدارة' : '💬 Admin Response'}</label>
                  <textarea
                    rows="4"
                    value={confirmData.adminResponse}
                    onChange={(e) => setConfirmData({...confirmData, adminResponse: e.target.value})}
                    placeholder={language === 'ar' ? 'أدخل رد الإدارة على مواصفات الطلب...' : 'Enter admin response to specifications...'}
                  />
                </div>

                <div className="om-form-group">
                  <label>{language === 'ar' ? '📋 ملاحظات إضافية' : '📋 Additional Notes'}</label>
                  <textarea
                    rows="3"
                    value={confirmData.additionalNotes}
                    onChange={(e) => setConfirmData({...confirmData, additionalNotes: e.target.value})}
                    placeholder={language === 'ar' ? 'ملاحظات إضافية (اختياري)...' : 'Additional notes (optional)...'}
                  />
                </div>
              </div>

              <div className="om-modal-actions">
                <button className="om-btn-cancel" onClick={() => setShowConfirmModal(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button className="om-btn-confirm" onClick={handleConfirmSpecs}>
                  ✅ {language === 'ar' ? 'تأكيد المواصفات' : 'Confirm Specifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
