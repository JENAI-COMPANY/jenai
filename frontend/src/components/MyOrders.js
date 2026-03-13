import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { userCancelOrder, userUpdateOrder } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/MyOrders.css';
import MobileDrawer from './MobileDrawer';

const MyOrders = () => {
  console.log('🔴🔴🔴 MyOrders component loaded - VERSION 2.0 WITH PRINT BUTTON 🔴🔴🔴');

  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    contactPhone: '',
    alternatePhone: '',
    notes: '',
    customOrderDetails: { specifications: '', requestedDeliveryDate: '', additionalNotes: '' },
    orderItems: []
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/orders/myorders', {
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
      received: 'mo-status-received',
      cancelled: 'mo-status-cancelled'
    };
    return statusMap[status] || 'mo-status-pending';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      prepared: language === 'ar' ? 'جاهز' : 'Prepared',
      on_the_way: language === 'ar' ? 'في الطريق' : 'On The Way',
      received: language === 'ar' ? 'تم الاستلام' : 'Received',
      cancelled: language === 'ar' ? 'ملغي' : 'Cancelled'
    };
    return statusLabels[status] || status;
  };

  // فتح نافذة الإلغاء
  const openCancelModal = (order, e) => {
    e.stopPropagation();
    setCancellingOrder(order);
    setCancelReason('');
  };

  // تأكيد إلغاء الطلب
  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await userCancelOrder(cancellingOrder._id, cancelReason);
      if (response.success) {
        setMessage(language === 'ar' ? 'تم إلغاء الطلب بنجاح' : 'Order cancelled successfully');
        setCancellingOrder(null);
        setCancelReason('');
        fetchOrders(); // تحديث القائمة
      }
    } catch (err) {
      setError(err.response?.data?.messageAr || err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
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
      customOrderDetails: {
        specifications: order.customOrderDetails?.specifications || '',
        requestedDeliveryDate: order.customOrderDetails?.requestedDeliveryDate
          ? new Date(order.customOrderDetails.requestedDeliveryDate).toISOString().split('T')[0]
          : '',
        additionalNotes: order.customOrderDetails?.additionalNotes || ''
      },
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

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
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

      // إضافة بيانات الطلب المخصص إذا كان طلب مخصص
      if (editingOrder.isCustomOrder) {
        updateData.customOrderDetails = editFormData.customOrderDetails;
      }

      const response = await userUpdateOrder(editingOrder._id, updateData);
      if (response.success) {
        setMessage(language === 'ar' ? 'تم تعديل الطلب بنجاح' : 'Order updated successfully');
        setEditingOrder(null);
        fetchOrders(); // تحديث القائمة
      }
    } catch (err) {
      setError(err.response?.data?.messageAr || err.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  // طباعة الطلب كـ PDF
  const handlePrintOrder = (order) => {
    const doc = new jsPDF();
    const isArabic = language === 'ar';

    // عنوان الوثيقة
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(isArabic ? 'فاتورة الطلب' : 'Order Invoice', 105, 20, { align: 'center' });

    // معلومات الشركة
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Jenai for Cooperative Marketing', 105, 30, { align: 'center' });

    let yPos = 45;

    // معلومات الطلب
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(isArabic ? 'Order Info' : 'معلومات الطلب', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${isArabic ? 'Order Number' : 'رقم الطلب'}: ${order.orderNumber}`, 15, yPos);
    yPos += 6;
    doc.text(`${isArabic ? 'Status' : 'الحالة'}: ${getStatusLabel(order.status)}`, 15, yPos);
    yPos += 6;
    doc.text(`${isArabic ? 'Date' : 'التاريخ'}: ${new Date(order.createdAt).toLocaleDateString()}`, 15, yPos);
    yPos += 6;

    const paymentMethodLabel =
      order.paymentMethod === 'cash_on_delivery' ? (isArabic ? 'Cash on Delivery' : 'الدفع عند التوصيل') :
      order.paymentMethod === 'cash_at_company' ? (isArabic ? 'Cash at Company' : 'كاش بالشركة') :
      order.paymentMethod === 'reflect' ? (isArabic ? 'Reflect' : 'ريفليكت') :
      order.paymentMethod;

    doc.text(`${isArabic ? 'Payment Method' : 'طريقة الدفع'}: ${paymentMethodLabel}`, 15, yPos);
    yPos += 12;

    // معلومات التواصل
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(isArabic ? 'Contact Info' : 'معلومات التواصل', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${isArabic ? 'Phone' : 'الهاتف'}: ${order.contactPhone || 'N/A'}`, 15, yPos);
    yPos += 6;
    if (order.alternatePhone) {
      doc.text(`${isArabic ? 'Alt Phone' : 'هاتف بديل'}: ${order.alternatePhone}`, 15, yPos);
      yPos += 6;
    }
    yPos += 6;

    // عنوان الشحن
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(isArabic ? 'Shipping Address' : 'عنوان الشحن', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(order.shippingAddress?.street || '', 15, yPos);
    yPos += 6;
    doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`, 15, yPos);
    yPos += 6;
    doc.text(order.shippingAddress?.country || '', 15, yPos);
    yPos += 12;

    // جدول المنتجات
    const tableColumns = [
      isArabic ? 'Product' : 'المنتج',
      isArabic ? 'Qty' : 'الكمية',
      isArabic ? 'Price' : 'السعر',
      isArabic ? 'Points' : 'النقاط',
      isArabic ? 'Total' : 'المجموع'
    ];

    const tableRows = order.orderItems?.map(item => {
      let itemName = item.name;
      if (item.selectedColor) {
        itemName += `\n🎨 ${isArabic ? 'اللون:' : 'Color:'} ${item.selectedColor}`;
      }
      if (item.selectedSize) {
        itemName += `\n📏 ${isArabic ? 'النمرة:' : 'Size:'} ${item.selectedSize}`;
      }
      return [
        itemName,
        item.quantity.toString(),
        `₪${item.price?.toFixed(2)}`,
        `${item.points || 0} ${isArabic ? 'pts' : 'نقطة'}`,
        `₪${(item.quantity * item.price)?.toFixed(2)}`
      ];
    }) || [];

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ملخص السعر
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const summaryX = 150;

    doc.text(`${isArabic ? 'Subtotal' : 'المجموع الفرعي'}:`, summaryX, yPos, { align: 'right' });
    doc.text(`₪${order.itemsPrice?.toFixed(2)}`, 195, yPos, { align: 'right' });
    yPos += 6;

    doc.text(`${isArabic ? 'Shipping' : 'الشحن'}:`, summaryX, yPos, { align: 'right' });
    doc.text(`₪${order.shippingPrice?.toFixed(2)}`, 195, yPos, { align: 'right' });
    yPos += 6;

    doc.text(`${isArabic ? 'Tax' : 'الضريبة'}:`, summaryX, yPos, { align: 'right' });
    doc.text(`₪${order.taxPrice?.toFixed(2)}`, 195, yPos, { align: 'right' });
    yPos += 6;

    if (order.discountAmount > 0) {
      doc.text(`${isArabic ? 'Discount' : 'الخصم'}:`, summaryX, yPos, { align: 'right' });
      doc.text(`-₪${order.discountAmount?.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 6;
    }

    // المجموع الكلي
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${isArabic ? 'Total' : 'الإجمالي'}:`, summaryX, yPos, { align: 'right' });
    doc.text(`₪${order.totalPrice?.toFixed(2)}`, 195, yPos, { align: 'right' });

    // ملاحظات
    if (order.notes) {
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(isArabic ? 'Notes' : 'ملاحظات', 15, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, 180);
      doc.text(splitNotes, 15, yPos);
    }

    // حفظ الملف
    doc.save(`Order-${order.orderNumber}.pdf`);
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
      {message && <div className="mo-alert mo-alert-success">{message}</div>}

      {orders.length === 0 ? (
        <div className="mo-empty">
          <p>{language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No orders yet'}</p>
        </div>
      ) : (
        <div className="mo-orders-grid">
          {orders.map(order => (
            <div key={order._id} className={`mo-order-card ${order.status === 'cancelled' ? 'mo-cancelled' : ''}`} onClick={() => setSelectedOrder(order)}>
              <div className="mo-order-header">
                <div className="mo-order-number">{order.orderNumber}</div>
                <div className={`mo-status-badge ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* شارة الطلب المخصص */}
              {order.isCustomOrder && (
                <div className="mo-custom-badge">
                  🎨 {language === 'ar' ? 'طلب مخصص' : 'Custom Order'}
                </div>
              )}

              <div className="mo-order-info">
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                  <span className="mo-value">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="mo-value mo-price">₪{order.totalPrice?.toFixed(2)}</span>
                </div>
                <div className="mo-info-row">
                  <span className="mo-label">{language === 'ar' ? 'المنتجات:' : 'Items:'}</span>
                  <span className="mo-value">{order.orderItems?.length || 0}</span>
                </div>
              </div>

              <div className="mo-card-actions">
                <button className="mo-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>

                {/* أزرار التعديل والإلغاء تظهر فقط للطلبات قيد الانتظار */}
                {order.status === 'pending' && (
                  <div className="mo-action-buttons">
                    <button
                      className="mo-edit-btn"
                      onClick={(e) => openEditModal(order, e)}
                    >
                      ✏️ {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button
                      className="mo-cancel-btn"
                      onClick={(e) => openCancelModal(order, e)}
                    >
                      ❌ {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details MobileDrawer */}
      <MobileDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
      >
        {selectedOrder && (
          <>
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

            {/* معلومات التواصل */}
            <div className="mo-detail-section">
              <h4>{language === 'ar' ? '📞 معلومات التواصل' : '📞 Contact Info'}</h4>
              <p><strong>{language === 'ar' ? 'رقم الهاتف الأساسي:' : 'Primary Phone:'}</strong> {selectedOrder.contactPhone || 'N/A'}</p>
              {selectedOrder.alternatePhone && (
                <p><strong>{language === 'ar' ? 'رقم الهاتف البديل:' : 'Alternate Phone:'}</strong> {selectedOrder.alternatePhone}</p>
              )}
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
                    <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderItems?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.name}
                        {item.selectedColor && (
                          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                            🎨 {language === 'ar' ? 'اللون:' : 'Color:'} {item.selectedColor}
                          </div>
                        )}
                        {item.selectedSize && (
                          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                            📏 {language === 'ar' ? 'النمرة:' : 'Size:'} {item.selectedSize}
                          </div>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>₪{item.price?.toFixed(2)}</td>
                      <td>{item.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mo-detail-section">
              <h4>{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h4>
              <p><strong>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</strong> ₪{selectedOrder.itemsPrice?.toFixed(2)}</p>
              <p><strong>{language === 'ar' ? 'الشحن:' : 'Shipping:'}</strong> ₪{selectedOrder.shippingPrice?.toFixed(2)}</p>
              <p><strong>{language === 'ar' ? 'الضريبة:' : 'Tax:'}</strong> ₪{selectedOrder.taxPrice?.toFixed(2)}</p>
              {selectedOrder.discountAmount > 0 && (
                <p><strong>{language === 'ar' ? 'الخصم:' : 'Discount:'}</strong> -₪{selectedOrder.discountAmount?.toFixed(2)}</p>
              )}
              <p className="mo-total"><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> ₪{selectedOrder.totalPrice?.toFixed(2)}</p>
            </div>

            {/* قسم الطلب المخصص */}
            {selectedOrder.isCustomOrder && selectedOrder.customOrderDetails && (
              <div className="mo-detail-section mo-custom-order-section">
                <h4>🎨 {language === 'ar' ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h4>

                <div className="mo-custom-field">
                  <strong>{language === 'ar' ? '📝 المواصفات:' : '📝 Specifications:'}</strong>
                  <p>{selectedOrder.customOrderDetails.specifications}</p>
                </div>

                {selectedOrder.customOrderDetails.requestedDeliveryDate && (
                  <div className="mo-custom-field">
                    <strong>{language === 'ar' ? '📅 موعد التسليم المطلوب:' : '📅 Requested Delivery:'}</strong>
                    <p>{new Date(selectedOrder.customOrderDetails.requestedDeliveryDate).toLocaleDateString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                )}

                {selectedOrder.customOrderDetails.additionalNotes && (
                  <div className="mo-custom-field">
                    <strong>{language === 'ar' ? '📋 ملاحظات إضافية:' : '📋 Additional Notes:'}</strong>
                    <p>{selectedOrder.customOrderDetails.additionalNotes}</p>
                  </div>
                )}

                {selectedOrder.customOrderDetails.adminResponse && (
                  <div className="mo-custom-field mo-admin-response">
                    <strong>{language === 'ar' ? '💬 رد الإدارة:' : '💬 Admin Response:'}</strong>
                    <p>{selectedOrder.customOrderDetails.adminResponse}</p>
                  </div>
                )}

                {selectedOrder.customOrderDetails.confirmedPrice && (
                  <div className="mo-custom-field">
                    <strong>{language === 'ar' ? '💰 السعر المؤكد:' : '💰 Confirmed Price:'}</strong>
                    <p className="mo-confirmed-price">₪{selectedOrder.customOrderDetails.confirmedPrice?.toFixed(2)}</p>
                  </div>
                )}

                <div className="mo-custom-status">
                  {selectedOrder.customOrderDetails.isConfirmed ? (
                    <span className="mo-confirmed-badge">✅ {language === 'ar' ? 'تم تأكيد الطلب' : 'Confirmed'}</span>
                  ) : (
                    <span className="mo-pending-badge">⏳ {language === 'ar' ? 'بانتظار التأكيد' : 'Pending Confirmation'}</span>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'ملاحظاتك' : 'Your Notes'}</h4>
                <p>{selectedOrder.notes}</p>
              </div>
            )}

            {/* أزرار التعديل والإلغاء في النافذة */}
            {selectedOrder.status === 'pending' && (
              <div className="mo-modal-actions">
                <button
                  className="mo-edit-btn-large"
                  onClick={() => {
                    setSelectedOrder(null);
                    openEditModal(selectedOrder, { stopPropagation: () => {} });
                  }}
                >
                  ✏️ {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
                </button>
                <button
                  className="mo-cancel-btn-large"
                  onClick={() => {
                    setSelectedOrder(null);
                    openCancelModal(selectedOrder, { stopPropagation: () => {} });
                  }}
                >
                  ❌ {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                </button>
              </div>
            )}
          </>
        )}
      </MobileDrawer>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="mo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header">
              <h3>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="mo-print-btn"
                  data-testid="print-order-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🖨️ Print button clicked!', selectedOrder);
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
                    fontSize: '14px'
                  }}
                >
                  🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
                </button>
                <button className="mo-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
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

              {/* معلومات التواصل */}
              <div className="mo-detail-section">
                <h4>{language === 'ar' ? '📞 معلومات التواصل' : '📞 Contact Info'}</h4>
                <p><strong>{language === 'ar' ? 'رقم الهاتف الأساسي:' : 'Primary Phone:'}</strong> {selectedOrder.contactPhone || 'N/A'}</p>
                {selectedOrder.alternatePhone && (
                  <p><strong>{language === 'ar' ? 'رقم الهاتف البديل:' : 'Alternate Phone:'}</strong> {selectedOrder.alternatePhone}</p>
                )}
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
                      <th>{language === 'ar' ? 'النقاط' : 'Points'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.name}
                          {item.selectedColor && (
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                              🎨 {language === 'ar' ? 'اللون:' : 'Color:'} {item.selectedColor}
                            </div>
                          )}
                          {item.selectedSize && (
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                              📏 {language === 'ar' ? 'النمرة:' : 'Size:'} {item.selectedSize}
                            </div>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>₪{item.price?.toFixed(2)}</td>
                        <td>{item.points || 0} {language === 'ar' ? 'نقطة' : 'pts'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mo-detail-section">
                <h4>{language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h4>
                <p><strong>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</strong> ₪{selectedOrder.itemsPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الشحن:' : 'Shipping:'}</strong> ₪{selectedOrder.shippingPrice?.toFixed(2)}</p>
                <p><strong>{language === 'ar' ? 'الضريبة:' : 'Tax:'}</strong> ₪{selectedOrder.taxPrice?.toFixed(2)}</p>
                {selectedOrder.discountAmount > 0 && (
                  <p><strong>{language === 'ar' ? 'الخصم:' : 'Discount:'}</strong> -₪{selectedOrder.discountAmount?.toFixed(2)}</p>
                )}
                <p className="mo-total"><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> ₪{selectedOrder.totalPrice?.toFixed(2)}</p>
              </div>

              {/* قسم الطلب المخصص */}
              {selectedOrder.isCustomOrder && selectedOrder.customOrderDetails && (
                <div className="mo-detail-section mo-custom-order-section">
                  <h4>🎨 {language === 'ar' ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h4>

                  <div className="mo-custom-field">
                    <strong>{language === 'ar' ? '📝 المواصفات:' : '📝 Specifications:'}</strong>
                    <p>{selectedOrder.customOrderDetails.specifications}</p>
                  </div>

                  {selectedOrder.customOrderDetails.requestedDeliveryDate && (
                    <div className="mo-custom-field">
                      <strong>{language === 'ar' ? '📅 موعد التسليم المطلوب:' : '📅 Requested Delivery:'}</strong>
                      <p>{new Date(selectedOrder.customOrderDetails.requestedDeliveryDate).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.additionalNotes && (
                    <div className="mo-custom-field">
                      <strong>{language === 'ar' ? '📋 ملاحظات إضافية:' : '📋 Additional Notes:'}</strong>
                      <p>{selectedOrder.customOrderDetails.additionalNotes}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.adminResponse && (
                    <div className="mo-custom-field mo-admin-response">
                      <strong>{language === 'ar' ? '💬 رد الإدارة:' : '💬 Admin Response:'}</strong>
                      <p>{selectedOrder.customOrderDetails.adminResponse}</p>
                    </div>
                  )}

                  {selectedOrder.customOrderDetails.confirmedPrice && (
                    <div className="mo-custom-field">
                      <strong>{language === 'ar' ? '💰 السعر المؤكد:' : '💰 Confirmed Price:'}</strong>
                      <p className="mo-confirmed-price">₪{selectedOrder.customOrderDetails.confirmedPrice?.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="mo-custom-status">
                    {selectedOrder.customOrderDetails.isConfirmed ? (
                      <span className="mo-confirmed-badge">✅ {language === 'ar' ? 'تم تأكيد الطلب' : 'Confirmed'}</span>
                    ) : (
                      <span className="mo-pending-badge">⏳ {language === 'ar' ? 'بانتظار التأكيد' : 'Pending Confirmation'}</span>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="mo-detail-section">
                  <h4>{language === 'ar' ? 'ملاحظاتك' : 'Your Notes'}</h4>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {/* أزرار التعديل والإلغاء في النافذة */}
              {selectedOrder.status === 'pending' && (
                <div className="mo-modal-actions">
                  <button
                    className="mo-edit-btn-large"
                    onClick={() => {
                      setSelectedOrder(null);
                      openEditModal(selectedOrder, { stopPropagation: () => {} });
                    }}
                  >
                    ✏️ {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
                  </button>
                  <button
                    className="mo-cancel-btn-large"
                    onClick={() => {
                      setSelectedOrder(null);
                      openCancelModal(selectedOrder, { stopPropagation: () => {} });
                    }}
                  >
                    ❌ {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order MobileDrawer */}
      <MobileDrawer
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        title={language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
      >
        {cancellingOrder && (
          <>
            <div className="mo-cancel-warning">
              <p>⚠️ {language === 'ar'
                ? `هل أنت متأكد من إلغاء الطلب رقم ${cancellingOrder.orderNumber}؟`
                : `Are you sure you want to cancel order ${cancellingOrder.orderNumber}?`}
              </p>
              <p className="mo-warning-note">
                {language === 'ar'
                  ? 'لا يمكن التراجع عن هذا الإجراء.'
                  : 'This action cannot be undone.'}
              </p>
            </div>

            <div className="mo-cancel-form">
              <label>{language === 'ar' ? 'سبب الإلغاء (اختياري):' : 'Cancellation Reason (optional):'}</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب سبب الإلغاء...' : 'Enter cancellation reason...'}
                rows="3"
              />
            </div>

            <div className="mo-cancel-actions">
              <button
                className="mo-btn-secondary"
                onClick={() => setCancellingOrder(null)}
                disabled={actionLoading}
              >
                {language === 'ar' ? 'تراجع' : 'Go Back'}
              </button>
              <button
                className="mo-btn-danger"
                onClick={handleCancelOrder}
                disabled={actionLoading}
              >
                {actionLoading
                  ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                  : (language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
              </button>
            </div>
          </>
        )}
      </MobileDrawer>

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <div className="mo-modal-overlay" onClick={() => setCancellingOrder(null)}>
          <div className="mo-modal mo-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header mo-cancel-header">
              <h3>❌ {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}</h3>
              <button className="mo-modal-close" onClick={() => setCancellingOrder(null)}>✕</button>
            </div>
            <div className="mo-modal-body">
              <div className="mo-cancel-warning">
                <p>⚠️ {language === 'ar'
                  ? `هل أنت متأكد من إلغاء الطلب رقم ${cancellingOrder.orderNumber}؟`
                  : `Are you sure you want to cancel order ${cancellingOrder.orderNumber}?`}
                </p>
                <p className="mo-warning-note">
                  {language === 'ar'
                    ? 'لا يمكن التراجع عن هذا الإجراء.'
                    : 'This action cannot be undone.'}
                </p>
              </div>

              <div className="mo-cancel-form">
                <label>{language === 'ar' ? 'سبب الإلغاء (اختياري):' : 'Cancellation Reason (optional):'}</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب سبب الإلغاء...' : 'Enter cancellation reason...'}
                  rows="3"
                />
              </div>

              <div className="mo-cancel-actions">
                <button
                  className="mo-btn-secondary"
                  onClick={() => setCancellingOrder(null)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'تراجع' : 'Go Back'}
                </button>
                <button
                  className="mo-btn-danger"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                    : (language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order MobileDrawer */}
      <MobileDrawer
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title={language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
        footerButtons={
          <>
            <button onClick={handleUpdateOrder} className="mo-btn-primary">
              {actionLoading
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
            <button onClick={() => setEditingOrder(null)} className="mo-btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </>
        }
      >
        {editingOrder && (
          <>
            <div className="mo-edit-form">
              {/* معلومات التواصل */}
              <div className="mo-form-section">
                <h4>📞 {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</h4>
                <div className="mo-form-row">
                  <div className="mo-form-group">
                    <label>{language === 'ar' ? 'رقم الهاتف الأساسي *' : 'Primary Phone *'}</label>
                    <input
                      type="tel"
                      value={editFormData.contactPhone}
                      onChange={(e) => setEditFormData({...editFormData, contactPhone: e.target.value})}
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="mo-form-group">
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
              <div className="mo-form-section">
                <h4>📍 {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h4>
                <div className="mo-form-group">
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
                <div className="mo-form-row">
                  <div className="mo-form-group">
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
                  <div className="mo-form-group">
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
                <div className="mo-form-row">
                  <div className="mo-form-group">
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
                  <div className="mo-form-group">
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
              <div className="mo-form-section">
                <h4>📝 {language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                <div className="mo-form-group">
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
                <div className="mo-form-section mo-products-edit-section">
                  <h4>🛍️ {language === 'ar' ? 'المنتجات والكميات' : 'Products & Quantities'}</h4>
                  <div className="mo-products-edit-list">
                    {editFormData.orderItems.map((item, index) => (
                      <div key={index} className="mo-product-edit-item">
                        <div className="mo-product-name">
                          <span className="mo-product-icon">📦</span>
                          <span>{item.name}</span>
                        </div>
                        <div className="mo-product-quantity">
                          <label>{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                          />
                        </div>
                        <div className="mo-product-subtotal">
                          <label>{language === 'ar' ? 'المجموع' : 'Subtotal'}</label>
                          <span className="mo-subtotal-value">₪{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mo-total-display">
                    <span className="mo-total-label">{language === 'ar' ? 'الإجمالي الجديد:' : 'New Total:'}</span>
                    <span className="mo-total-value">₪{calculateNewTotal().toFixed(2)}</span>
                  </div>
                  <div className="mo-edit-note">
                    <small>ℹ️ {language === 'ar'
                      ? 'ملاحظة: سيتم تحديث المجموع الكلي للطلب بناءً على الكميات الجديدة'
                      : 'Note: Order total will be updated based on new quantities'}</small>
                  </div>
                </div>
              )}

              {/* تفاصيل الطلب المخصص */}
              {editingOrder.isCustomOrder && (
                <div className="mo-form-section mo-custom-edit-section">
                  <h4>🎨 {language === 'ar' ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h4>
                  <div className="mo-form-group">
                    <label>{language === 'ar' ? 'المواصفات المطلوبة *' : 'Specifications *'}</label>
                    <textarea
                      value={editFormData.customOrderDetails.specifications}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        customOrderDetails: {...editFormData.customOrderDetails, specifications: e.target.value}
                      })}
                      rows="3"
                      required
                    />
                  </div>
                  <div className="mo-form-group">
                    <label>{language === 'ar' ? 'موعد التسليم المطلوب' : 'Requested Delivery Date'}</label>
                    <input
                      type="date"
                      value={editFormData.customOrderDetails.requestedDeliveryDate}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        customOrderDetails: {...editFormData.customOrderDetails, requestedDeliveryDate: e.target.value}
                      })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="mo-form-group">
                    <label>{language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                    <textarea
                      value={editFormData.customOrderDetails.additionalNotes}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        customOrderDetails: {...editFormData.customOrderDetails, additionalNotes: e.target.value}
                      })}
                      rows="2"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </MobileDrawer>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="mo-modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="mo-modal mo-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header mo-edit-header">
              <h3>✏️ {language === 'ar' ? 'تعديل الطلب' : 'Edit Order'} - {editingOrder.orderNumber}</h3>
              <button className="mo-modal-close" onClick={() => setEditingOrder(null)}>✕</button>
            </div>
            <div className="mo-modal-body">
              <div className="mo-edit-form">
                {/* معلومات التواصل */}
                <div className="mo-form-section">
                  <h4>📞 {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</h4>
                  <div className="mo-form-row">
                    <div className="mo-form-group">
                      <label>{language === 'ar' ? 'رقم الهاتف الأساسي *' : 'Primary Phone *'}</label>
                      <input
                        type="tel"
                        value={editFormData.contactPhone}
                        onChange={(e) => setEditFormData({...editFormData, contactPhone: e.target.value})}
                        dir="ltr"
                        required
                      />
                    </div>
                    <div className="mo-form-group">
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
                <div className="mo-form-section">
                  <h4>📍 {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h4>
                  <div className="mo-form-group">
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
                  <div className="mo-form-row">
                    <div className="mo-form-group">
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
                    <div className="mo-form-group">
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
                  <div className="mo-form-row">
                    <div className="mo-form-group">
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
                    <div className="mo-form-group">
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
                <div className="mo-form-section">
                  <h4>📝 {language === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                  <div className="mo-form-group">
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
                  <div className="mo-form-section mo-products-edit-section">
                    <h4>🛍️ {language === 'ar' ? 'المنتجات والكميات' : 'Products & Quantities'}</h4>
                    <div className="mo-products-edit-list">
                      {editFormData.orderItems.map((item, index) => (
                        <div key={index} className="mo-product-edit-item">
                          <div className="mo-product-name">
                            <span className="mo-product-icon">📦</span>
                            <span>{item.name}</span>
                          </div>
                          <div className="mo-product-quantity">
                            <label>{language === 'ar' ? 'الكمية' : 'Quantity'}</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                            />
                          </div>
                          <div className="mo-product-subtotal">
                            <label>{language === 'ar' ? 'المجموع' : 'Subtotal'}</label>
                            <span className="mo-subtotal-value">₪{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mo-total-display">
                      <span className="mo-total-label">{language === 'ar' ? 'الإجمالي الجديد:' : 'New Total:'}</span>
                      <span className="mo-total-value">₪{calculateNewTotal().toFixed(2)}</span>
                    </div>
                    <div className="mo-edit-note">
                      <small>ℹ️ {language === 'ar'
                        ? 'ملاحظة: سيتم تحديث المجموع الكلي للطلب بناءً على الكميات الجديدة'
                        : 'Note: Order total will be updated based on new quantities'}</small>
                    </div>
                  </div>
                )}

                {/* تفاصيل الطلب المخصص */}
                {editingOrder.isCustomOrder && (
                  <div className="mo-form-section mo-custom-edit-section">
                    <h4>🎨 {language === 'ar' ? 'تفاصيل الطلب المخصص' : 'Custom Order Details'}</h4>
                    <div className="mo-form-group">
                      <label>{language === 'ar' ? 'المواصفات المطلوبة *' : 'Specifications *'}</label>
                      <textarea
                        value={editFormData.customOrderDetails.specifications}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          customOrderDetails: {...editFormData.customOrderDetails, specifications: e.target.value}
                        })}
                        rows="3"
                        required
                      />
                    </div>
                    <div className="mo-form-group">
                      <label>{language === 'ar' ? 'موعد التسليم المطلوب' : 'Requested Delivery Date'}</label>
                      <input
                        type="date"
                        value={editFormData.customOrderDetails.requestedDeliveryDate}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          customOrderDetails: {...editFormData.customOrderDetails, requestedDeliveryDate: e.target.value}
                        })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="mo-form-group">
                      <label>{language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                      <textarea
                        value={editFormData.customOrderDetails.additionalNotes}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          customOrderDetails: {...editFormData.customOrderDetails, additionalNotes: e.target.value}
                        })}
                        rows="2"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mo-edit-actions">
                <button
                  className="mo-btn-secondary"
                  onClick={() => setEditingOrder(null)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  className="mo-btn-primary"
                  onClick={handleUpdateOrder}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
