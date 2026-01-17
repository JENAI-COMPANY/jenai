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
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/orders', {
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
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
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
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contactPhone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
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
            placeholder={language === 'ar' ? 'بحث برقم الطلب، العميل أو الهاتف...' : 'Search by order number, customer or phone...'}
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
      </div>

      {/* Orders Stats */}
      <div className="om-stats">
        <div className="om-stat-card">
          <h3>{orders.length}</h3>
          <p>{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
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
                <tr key={order._id}>
                  <td className="om-order-number">{order.orderNumber}</td>
                  <td>{order.user?.name || 'N/A'}</td>
                  <td>{order.contactPhone}</td>
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
    </div>
  );
};

export default OrderManagement;
