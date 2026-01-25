const express = require('express');
const router = express.Router();
const {
  protect,
  isSupplier,
  isSuperAdmin,
  checkSupplierActive,
  checkSupplierCategories
} = require('../middleware/auth');

const {
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getMyStats,
  approveProduct,
  rejectProduct,
  getPendingProducts,
  getProductsByStatus
} = require('../controllers/supplierProductController');

// ====================================
// Routes للموردين (Supplier)
// ====================================

// GET /api/supplier/products - منتجات المورد
router.get(
  '/products',
  protect,
  isSupplier,
  checkSupplierActive,
  getMyProducts
);

// POST /api/supplier/products - إضافة منتج جديد
router.post(
  '/products',
  protect,
  isSupplier,
  checkSupplierActive,
  checkSupplierCategories,
  addProduct
);

// PUT /api/supplier/products/:id - تعديل منتج
router.put(
  '/products/:id',
  protect,
  isSupplier,
  checkSupplierActive,
  updateProduct
);

// DELETE /api/supplier/products/:id - حذف منتج
router.delete(
  '/products/:id',
  protect,
  isSupplier,
  checkSupplierActive,
  deleteProduct
);

// GET /api/supplier/stats - إحصائيات المورد
router.get(
  '/stats',
  protect,
  isSupplier,
  checkSupplierActive,
  getMyStats
);

// ====================================
// Routes للـ Super Admin فقط
// ====================================

// GET /api/supplier/admin/pending - المنتجات المنتظرة
router.get(
  '/admin/pending',
  protect,
  isSuperAdmin,
  getPendingProducts
);

// GET /api/supplier/admin/by-status/:status - المنتجات حسب الحالة
router.get(
  '/admin/by-status/:status',
  protect,
  isSuperAdmin,
  getProductsByStatus
);

// PUT /api/supplier/admin/products/:id/approve - الموافقة على منتج
router.put(
  '/admin/products/:id/approve',
  protect,
  isSuperAdmin,
  approveProduct
);

// PUT /api/supplier/admin/products/:id/reject - رفض منتج
router.put(
  '/admin/products/:id/reject',
  protect,
  isSuperAdmin,
  rejectProduct
);

module.exports = router;
