const { Book } = require('../models/Library');

// Get all books (for subscribers and admins)
exports.getBooks = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAr: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { authorAr: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      books
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single book
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create book (super admin only)
exports.createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update book (super admin only)
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete book (super admin only)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download book (increment download count)
exports.downloadBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      success: true,
      fileUrl: book.fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get book categories
exports.getBookCategories = async (req, res) => {
  try {
    const categories = await Book.distinct('category', { isActive: true });
    const categoriesAr = await Book.distinct('categoryAr', { isActive: true });

    res.json({
      success: true,
      categories,
      categoriesAr
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
