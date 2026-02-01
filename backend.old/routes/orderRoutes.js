const express = require('express');
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  cancelOrder,
  searchOrders,
  userCancelOrder,
  userUpdateOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, authorize('regional_admin', 'super_admin'), getAllOrders);

router.get('/myorders', protect, getMyOrders);

// مسار البحث في الطلبات
router.get('/search', protect, authorize('regional_admin', 'super_admin'), searchOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/status', protect, authorize('regional_admin', 'super_admin'), updateOrderStatus);

// مسار تأكيد مواصفات الطلب المخصص (للآدمن فقط)
router.put('/:id/confirm-specs', protect, authorize('regional_admin', 'super_admin'), require('../controllers/orderController').confirmCustomOrderSpecs);

// مسار إلغاء الطلب من الأدمن
router.put('/:id/cancel', protect, authorize('regional_admin', 'super_admin'), cancelOrder);

// مسارات المستخدم لإلغاء وتعديل الطلب (فقط عندما يكون قيد الانتظار)
router.put('/:id/user-cancel', protect, userCancelOrder);
router.put('/:id/user-update', protect, userUpdateOrder);

module.exports = router;
