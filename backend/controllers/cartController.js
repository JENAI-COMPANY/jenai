const Cart = require('../models/Cart');

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    res.json({ success: true, items: cart ? cart.items : [] });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب السلة' });
  }
};

// POST /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { product, name, description, customerPrice, subscriberPrice, points, stock, images, category, quantity, selectedColor, selectedSize, customerDiscount, subscriberDiscount } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      i => i.product.toString() === product &&
           i.selectedColor === (selectedColor || '') &&
           i.selectedSize === (selectedSize || '')
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity || 1;
    } else {
      cart.items.push({ product, name, description, customerPrice, subscriberPrice, points, stock, images, category, quantity: quantity || 1, selectedColor: selectedColor || '', selectedSize: selectedSize || '', customerDiscount, subscriberDiscount });
    }

    await cart.save();
    res.json({ success: true, items: cart.items });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ message: 'خطأ في إضافة للسلة' });
  }
};

// PUT /api/cart/update
exports.updateQuantity = async (req, res) => {
  try {
    const { product, quantity, selectedColor, selectedSize } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'السلة غير موجودة' });

    const index = cart.items.findIndex(
      i => i.product.toString() === product &&
           i.selectedColor === (selectedColor || '') &&
           i.selectedSize === (selectedSize || '')
    );

    if (index < 0) return res.status(404).json({ message: 'المنتج غير موجود في السلة' });

    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, items: cart.items });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث السلة' });
  }
};

// DELETE /api/cart/remove
exports.removeFromCart = async (req, res) => {
  try {
    const { product, selectedColor, selectedSize } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'السلة غير موجودة' });

    cart.items = cart.items.filter(
      i => !(i.product.toString() === product &&
             i.selectedColor === (selectedColor || '') &&
             i.selectedSize === (selectedSize || ''))
    );

    await cart.save();
    res.json({ success: true, items: cart.items });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المنتج من السلة' });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, items: [] });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تفريغ السلة' });
  }
};
