const Category = require('../models/Category');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    // Return full category objects with images
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add new category
exports.addCategory = async (req, res) => {
  try {
    const { name, nameAr, nameEn, description, descriptionAr, descriptionEn, displayOrder } = req.body;

    if (!nameAr || !nameAr.trim() || !nameEn || !nameEn.trim()) {
      return res.status(400).json({ message: 'Category names in both languages are required' });
    }

    // Use nameAr as default name if not provided
    const categoryName = name && name.trim() ? name.trim() : nameAr.trim();

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const categoryData = {
      name: categoryName,
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      description: description || '',
      descriptionAr: descriptionAr || '',
      descriptionEn: descriptionEn || '',
      displayOrder: displayOrder || 0
    };

    // Handle image upload
    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(categoryData);
    res.status(201).json({ message: 'Category added successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { name } = req.params;

    const category = await Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Soft delete - just mark as inactive
    category.isActive = false;
    await category.save();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all categories including inactive (for admin)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, nameEn, description, descriptionAr, descriptionEn, displayOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update fields
    if (nameAr && nameAr.trim()) category.nameAr = nameAr.trim();
    if (nameEn && nameEn.trim()) category.nameEn = nameEn.trim();
    if (name && name.trim()) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (descriptionAr !== undefined) category.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) category.descriptionEn = descriptionEn;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    // Handle image upload
    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    await category.save();
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
