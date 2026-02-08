import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/OrderManagement.css';

const OrderManagement = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
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
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    contactPhone: '',
    alternatePhone: '',
    notes: '',
    orderItems: []
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
    // Block category_admin from setting "received" status
    if (user?.role === 'category_admin' && newStatus === 'received') {
      setError(language === 'ar'
        ? 'مدراء الأقسام لا يمكنهم تأكيد استلام الطلب'
        : 'Category admins cannot confirm order receipt');
      setTimeout(() => setError(''), 3000);
      return;
    }

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

  // فتح نافذة التعديل
  const openEditModal = (order, e) => {
    e.stopPropagation();
    setEditingOrder(order);
    setEditFormData({
      shippingAddress: {
        street: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        zipCode: order.shippingAddress?.zipCode || '',
        country: order.shippingAddress?.country || ''
      },
      contactPhone: order.contactPhone || '',
      alternatePhone: order.alternatePhone || '',
      notes: order.notes || '',
      orderItems: order.orderItems?.map(item => ({
        _id: item._id,
        productId: item.product?._id || item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.price
      })) || []
    });
  };

  // تحديث كمية منتج
  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    if (quantity < 1) return;

    const updatedItems = [...editFormData.orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: quantity
    };

    setEditFormData({
      ...editFormData,
      orderItems: updatedItems
    });
  };

  // حساب المجموع الجديد
  const calculateNewTotal = () => {
    return editFormData.orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  // تأكيد تعديل الطلب
  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        shippingAddress: editFormData.shippingAddress,
        contactPhone: editFormData.contactPhone,
        alternatePhone: editFormData.alternatePhone,
        notes: editFormData.notes,
        orderItems: editFormData.orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      await axios.put(
        `/api/admin/orders/${editingOrder._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(language === 'ar' ? 'تم تعديل الطلب بنجاح' : 'Order updated successfully');
      setEditingOrder(null);
      fetchOrders();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.messageAr || err.response?.data?.message || 'Failed to update order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePrintOrder = (order) => {
    const isArabic = language === 'ar';

    // Get payment method label
    const getPaymentMethodLabel = (method) => {
      if (method === 'cash_on_delivery') return isArabic ? 'الدفع عند التوصيل' : 'Cash on Delivery';
      if (method === 'cash_at_company') return isArabic ? 'كاش بالشركة' : 'Cash at Company';
      if (method === 'reflect') return isArabic ? 'ريفليكت' : 'Reflect';
      return method;
    };

    // Create invoice content function
    const createInvoiceContent = () => `
      <div class="invoice-copy">
        <div class="header">
          <h1>${isArabic ? 'فاتورة الطلب' : 'Order Invoice'}</h1>
          <p>Jenai for Cooperative Marketing</p>
          <p>jenai-4u.com</p>
        </div>

        <div class="section">
          <h3>${isArabic ? 'معلومات الطلب' : 'Order Information'}</h3>
          <p><strong>${isArabic ? 'رقم الطلب:' : 'Order Number:'}</strong> ${order.orderNumber}</p>
          <p><strong>${isArabic ? 'الحالة:' : 'Status:'}</strong> ${getStatusLabel(order.status)}</p>
          <p><strong>${isArabic ? 'التاريخ:' : 'Date:'}</strong> ${new Date(order.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</p>
          <p><strong>${isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</strong> ${getPaymentMethodLabel(order.paymentMethod)}</p>
        </div>

        <div class="section">
          <h3>${isArabic ? 'معلومات العميل' : 'Customer Information'}</h3>
          <p><strong>${isArabic ? 'الاسم:' : 'Name:'}</strong> ${order.user?.name || 'N/A'}</p>
          <p><strong>${isArabic ? 'الهاتف:' : 'Phone:'}</strong> ${order.contactPhone}</p>
          ${order.alternatePhone ? `<p><strong>${isArabic ? 'هاتف بديل:' : 'Alternate Phone:'}</strong> ${order.alternatePhone}</p>` : ''}
        </div>

        <div class="section">
          <h3>${isArabic ? 'عنوان الشحن' : 'Shipping Address'}</h3>
          <p>${order.shippingAddress?.street || ''}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}</p>
          <p>${order.shippingAddress?.country || ''}</p>
        </div>

        <div class="section">
          <h3>${isArabic ? 'المنتجات' : 'Products'}</h3>
          <table>
            <thead>
              <tr>
                <th>${isArabic ? 'المنتج' : 'Product'}</th>
                <th style="text-align: center;">${isArabic ? 'الكمية' : 'Quantity'}</th>
                <th>${isArabic ? 'السعر' : 'Price'}</th>
                <th style="text-align: center;">${isArabic ? 'النقاط' : 'Points'}</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems?.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td>$${item.price?.toFixed(2)}</td>
                  <td style="text-align: center;">${item.points || 0} ${isArabic ? 'نقطة' : 'pts'}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>${isArabic ? 'ملخص الطلب' : 'Order Summary'}</h3>
          <p><strong>${isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</strong> $${order.itemsPrice?.toFixed(2)}</p>
          <p><strong>${isArabic ? 'الشحن:' : 'Shipping:'}</strong> $${order.shippingPrice?.toFixed(2)}</p>
          <p><strong>${isArabic ? 'الضريبة:' : 'Tax:'}</strong> $${order.taxPrice?.toFixed(2)}</p>
          ${order.discountAmount > 0 ? `<p><strong>${isArabic ? 'الخصم:' : 'Discount:'}</strong> -$${order.discountAmount?.toFixed(2)}</p>` : ''}
          <p class="total">
            <strong>${isArabic ? 'الإجمالي:' : 'Total:'}</strong>
            <span class="total-amount">$${order.totalPrice?.toFixed(2)}</span>
          </p>
          ${order.totalPoints ? `<p style="color: #10b981; font-weight: bold; margin-top: 8px;"><strong>${isArabic ? '⭐ النقاط المكتسبة:' : '⭐ Points Earned:'}</strong> ${order.totalPoints}</p>` : ''}
        </div>

        ${order.isCustomOrder && order.customOrderDetails ? `
          <div class="section">
            <h3>${isArabic ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h3>
            ${order.customOrderDetails.specifications ? `
              <p><strong>${isArabic ? 'المواصفات:' : 'Specifications:'}</strong> ${order.customOrderDetails.specifications}</p>
            ` : ''}
            ${order.customOrderDetails.confirmedPrice ? `
              <p><strong>${isArabic ? 'السعر المؤكد:' : 'Confirmed Price:'}</strong> $${order.customOrderDetails.confirmedPrice.toFixed(2)}</p>
            ` : ''}
            ${order.customOrderDetails.adminResponse ? `
              <p><strong>${isArabic ? 'رد الإدارة:' : 'Admin Response:'}</strong> ${order.customOrderDetails.adminResponse}</p>
            ` : ''}
          </div>
        ` : ''}

        ${order.notes ? `
          <div class="section">
            <p><strong>${isArabic ? 'ملاحظات العميل:' : 'Customer Notes:'}</strong> ${order.notes}</p>
          </div>
        ` : ''}
      </div>
    `;

    // Create print window
    const printWindow = window.open('', '_blank');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="${isArabic ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Order ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            direction: ${isArabic ? 'rtl' : 'ltr'};
            font-size: 11px;
          }
          .invoice-copy {
            padding: 15px;
            height: 297mm;
            page-break-after: always;
          }
          .invoice-copy:last-child {
            page-break-after: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #10b981;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #10b981;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .header p {
            font-size: 10px;
            margin: 2px 0;
          }
          .section {
            margin-bottom: 12px;
          }
          .section h3 {
            color: #10b981;
            border-bottom: 1.5px solid #10b981;
            padding-bottom: 3px;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .section p {
            margin: 3px 0;
            line-height: 1.4;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: ${isArabic ? 'right' : 'left'};
            font-size: 10px;
          }
          th {
            background-color: #10b981;
            color: white;
          }
          .total {
            font-size: 13px;
            margin-top: 8px;
            font-weight: bold;
          }
          .total-amount {
            color: #10b981;
          }
          @media print {
            @page {
              size: 210mm 594mm;
              margin: 0;
            }
            body {
              padding: 0;
              font-size: 10px;
            }
            .invoice-copy {
              padding: 15px;
              height: 297mm;
            }
            .header h1 {
              font-size: 14px;
            }
            .section h3 {
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        ${createInvoiceContent()}
        ${createInvoiceContent()}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
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
                      {user?.role !== 'category_admin' && (
                        <option value="received">{language === 'ar' ? 'تم الاستلام' : 'Received'}</option>
                      )}
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="om-print-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintOrder(selectedOrder);
                  }}
                  title={language === 'ar' ? 'طباعة الطلب' : 'Print Order'}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
                </button>
                <button className="om-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
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
                      <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price?.toFixed(2)}</td>
                        <td>{item.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</td>
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
                {selectedOrder.totalPoints && (
                  <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>
                    <strong>{language === 'ar' ? '⭐ النقاط المكتسبة:' : '⭐ Points Earned:'}</strong> {selectedOrder.totalPoints}
                  </p>
                )}
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

              {/* زر تعديل الطلب */}
              {selectedOrder.status === 'pending' && (
                <div className="om-modal-actions">
                  <button
                    className="om-edit-btn-large"
                    onClick={() => {
                      setSelectedOrder(null);
                      openEditModal(selectedOrder, { stopPropagation: () => {} });
                    }}
                  >
                    ✏️ {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="om-modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="om-modal om-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="om-modal-header om-edit-header">
              <h3>✏️ {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'} - {editingOrder.orderNumber}</h3>
              <button className="om-modal-close" onClick={() => setEditingOrder(null)}>✕</button>
            </div>
            <div className="om-modal-body">
              <div className="om-edit-form">
                {/* معلومات التواصل */}
                <div className="om-form-section">
                  <h4>📞 {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</h4>
                  <div className="om-form-row">
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'رقم الهاتف الأساسي *' : 'Primary Phone *'}</label>
                      <input
                        type="tel"
                        value={editFormData.contactPhone}
                        onChange={(e) => setEditFormData({...editFormData, contactPhone: e.target.value})}
                        dir="ltr"
                        required
                      />
                    </div>
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'رقم الهاتف البديل' : 'Alternate Phone'}</label>
                      <input
                        type="tel"
                        value={editFormData.alternatePhone}
                        onChange={(e) => setEditFormData({...editFormData, alternatePhone: e.target.value})}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* عنوان الشحن */}
                <div className="om-form-section">
                  <h4>📍 {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h4>
                  <div className="om-form-group">
                    <label>{language === 'ar' ? 'العنوان التفصيلي *' : 'Street Address *'}</label>
                    <input
                      type="text"
                      value={editFormData.shippingAddress.street}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        shippingAddress: {...editFormData.shippingAddress, street: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="om-form-row">
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'المدينة *' : 'City *'}</label>
                      <input
                        type="text"
                        value={editFormData.shippingAddress.city}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          shippingAddress: {...editFormData.shippingAddress, city: e.target.value}
                        })}
                        required
                      />
                    </div>
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'المنطقة *' : 'State *'}</label>
                      <input
                        type="text"
                        value={editFormData.shippingAddress.state}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          shippingAddress: {...editFormData.shippingAddress, state: e.target.value}
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div className="om-form-row">
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'الرمز البريدي *' : 'ZIP Code *'}</label>
                      <input
                        type="text"
                        value={editFormData.shippingAddress.zipCode}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          shippingAddress: {...editFormData.shippingAddress, zipCode: e.target.value}
                        })}
                        required
                      />
                    </div>
                    <div className="om-form-group">
                      <label>{language === 'ar' ? 'الدولة *' : 'Country *'}</label>
                      <input
                        type="text"
                        value={editFormData.shippingAddress.country}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          shippingAddress: {...editFormData.shippingAddress, country: e.target.value}
                        })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ملاحظات */}
                <div className="om-form-section">
                  <h4>📝 {language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                  <div className="om-form-group">
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                      placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                      rows="2"
                    />
                  </div>
                </div>

                {/* المنتجات والكميات */}
                {!editingOrder.isCustomOrder && editFormData.orderItems.length > 0 && (
                  <div className="om-form-section om-products-edit-section">
                    <h4>🛍️ {language === 'ar' ? 'المنتجات والكميات' : 'Products & Quantities'}</h4>
                    <div className="om-products-edit-list">
                      {editFormData.orderItems.map((item, index) => (
                        <div key={index} className="om-product-edit-item">
                          <div className="om-product-name">
                            <span className="om-product-icon">📦</span>
                            <span>{item.name}</span>
                          </div>
                          <div className="om-product-quantity">
                            <label>{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                            />
                          </div>
                          <div className="om-product-subtotal">
                            <label>{language === 'ar' ? 'المجموع' : 'Subtotal'}</label>
                            <span className="om-subtotal-value">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="om-total-display">
                      <span className="om-total-label">{language === 'ar' ? 'الإجمالي الجديد:' : 'New Total:'}</span>
                      <span className="om-total-value">${calculateNewTotal().toFixed(2)}</span>
                    </div>
                    <div className="om-edit-note">
                      <small>ℹ️ {language === 'ar'
                        ? 'ملاحظة: سيتم تحديث المجموع الكلي للطلب بناءً على الكميات الجديدة'
                        : 'Note: Order total will be updated based on new quantities'}</small>
                    </div>
                  </div>
                )}
              </div>

              <div className="om-edit-actions">
                <button
                  className="om-btn-cancel"
                  onClick={() => setEditingOrder(null)}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  className="om-btn-confirm"
                  onClick={handleUpdateOrder}
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
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
