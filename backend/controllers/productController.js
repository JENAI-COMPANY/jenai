const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      productData.media = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        filename: file.filename
      }));

      // Set first image as main image for backward compatibility
      if (productData.media.length > 0 && productData.media[0].type === 'image') {
        productData.images = [productData.media[0].url];
      }
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      // Get existing product to preserve old media if needed
      const existingProduct = await Product.findById(req.params.id);

      const newMedia = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        filename: file.filename
      }));

      // Append new media to existing media
      if (existingProduct && existingProduct.media) {
        productData.media = [...existingProduct.media, ...newMedia];
      } else {
        productData.media = newMedia;
      }

      // Set first image as main image for backward compatibility
      if (productData.media.length > 0) {
        const firstImage = productData.media.find(m => m.type === 'image');
        if (firstImage) {
          productData.images = [firstImage.url];
        }
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
