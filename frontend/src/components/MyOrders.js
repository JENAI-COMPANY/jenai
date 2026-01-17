import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MyOrders.css';

const MyOrders = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders/myorders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data || response.data.orders || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'mo-status-pending',
      prepared: 'mo-status-prepared',
      on_the_way: 'mo-status-on-way',
      received: 'mo-status-received'
    };
    return statusMap[status] || 'mo-status-pending';
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

  if (loading) {
    return (
      <div className="my-orders loading">
        <div className="mo-spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading orders...'}</p>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <div className="mo-header">
        <h2>{language === 'ar' ? 'طلباتي' : 'My Orders'}</h2>
        <p className="mo-subtitle">
          {language === 'ar' ? 'تتبع جميع طلباتك' : 'Track all your orders'}
        </p>
      </div>

      {error && <div className="mo-alert mo-alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="mo-empty">
          <p>{language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No orders yet'}</p>
        </div>
      ) : (
        <div className="mo-orders-grid">
          {orders.map(order => (
            <div key={order._id} className="mo-order-card" onClick={() => setSelectedOrder(order)}>
              <div className="mo-order-header">
                <div className="mo-order-number">{order.orderNumber}</div>
                <div className={`mo-status-badge ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="mo-order-info">
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                  <span className="mo-value">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="mo-value mo-price">${order.totalPrice?.toFixed(2)}</span>
                </div>
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'المنتجات:' : 'Items:'}</span>
                  <span className="mo-value">{order.orderItems?.length || 0}</span>
                </div>
              </div>

              <button className="mo-view-btn">
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="mo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header">
              <h3>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
              <button className="mo-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="mo-modal-body">
              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'معلومات الطلب' : 'Order Information'}</h4>
                <p><strong>{language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> {selectedOrder.orderNumber}</p>
                <p><strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong> <span className={`mo-status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>{getStatusLabel(selectedOrder.status)}</span></p>
                <p><strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><strong>{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</strong> {
                  selectedOrder.paymentMethod === 'cash_on_delivery' ? (language === 'ar' ? 'الدفع عند التوصيل' : 'Cash on Delivery') :
                  selectedOrder.paymentMethod === 'cash_at_company' ? (language === 'ar' ? 'كاش بالشركة' : 'Cash at Company') :
                  selectedOrder.paymentMethod === 'reflect' ? (language === 'ar' ? 'ريفليكت' : 'Reflect') :
                  selectedOrder.paymentMethod
                }</p>
              </div>

              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h4>
                <p>{selectedOrder.shippingAddress?.street}</p>
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                <p>{selectedOrder.shippingAddress?.country}</p>
              </div>

              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'المنتجات' : 'Products'}</h4>
                <table className="mo-products-table">
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

              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h4>
                <p><strong>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</strong> ${selectedOrder.itemsPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الشحن:' : 'Shipping:'}</strong> ${selectedOrder.shippingPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الضريبة:' : 'Tax:'}</strong> ${selectedOrder.taxPrice?.toFixed(2)}</p>
                {selectedOrder.discountAmount > 0 && (
                  <p><strong>{language === 'ar' ? 'الخصم:' : 'Discount:'}</strong> -${selectedOrder.discountAmount?.toFixed(2)}</p>
                )}
                <p className="mo-total"><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> ${selectedOrder.totalPrice?.toFixed(2)}</p>
              </div>

              {selectedOrder.notes && (
                <div className="mo-detail-section">
                  <h4>{language === 'ar' ? 'ملاحظاتك' : 'Your Notes'}</h4>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
