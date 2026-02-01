const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/auth');

// استيراد Controllers
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierCategories,
  toggleSupplierStatus,
  deleteSupplier,
  getSupplierProducts,
  getSupplierStats
} = require('../controllers/supplierController');

// ====================================
// Routes للـ Super Admin فقط
// ====================================

// GET /api/suppliers - الحصول على جميع الموردين
router.get('/', protect, isSuperAdmin, getAllSuppliers);

// POST /api/suppliers - إنشاء مورد جديد
router.post('/', protect, isSuperAdmin, createSupplier);

// GET /api/suppliers/:id - الحصول على مورد محدد
router.get('/:id', protect, isSuperAdmin, getSupplierById);

// PUT /api/suppliers/:id - تحديث مورد
router.put('/:id', protect, isSuperAdmin, updateSupplier);

// PUT /api/suppliers/:id/categories - تحديث الأقسام المسموح بها للمورد
router.put('/:id/categories', protect, isSuperAdmin, updateSupplierCategories);

// PUT /api/suppliers/:id/toggle-status - تفعيل/تعطيل المورد
router.put('/:id/toggle-status', protect, isSuperAdmin, toggleSupplierStatus);

// DELETE /api/suppliers/:id - حذف مورد
router.delete('/:id', protect, isSuperAdmin, deleteSupplier);

// GET /api/suppliers/:id/products - الحصول على منتجات المورد
router.get('/:id/products', protect, getSupplierProducts);

// GET /api/suppliers/:id/stats - إحصائيات المورد
router.get('/:id/stats', protect, getSupplierStats);

module.exports = router;
