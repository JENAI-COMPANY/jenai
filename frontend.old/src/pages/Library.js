import React, { useState, useEffect, useContext } from 'react';
import { getBooks, downloadBook, createBook, updateBook, deleteBook } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/Library.css';

const Library = () => {
  const { language } = useLanguage();
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    author: '',
    authorAr: '',
    category: '',
    categoryAr: '',
    coverImage: '',
    fileUrl: '',
    fileType: 'pdf',
    pages: ''
  });

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchBooks();
  }, [searchTerm, selectedCategory]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const data = await getBooks(params);
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (book) => {
    try {
      const data = await downloadBook(book._id);
      window.open(data.fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading book:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await updateBook(editingBook._id, formData);
      } else {
        await createBook(formData);
      }
      setShowAddModal(false);
      setEditingBook(null);
      resetForm();
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      titleAr: book.titleAr,
      description: book.description || '',
      descriptionAr: book.descriptionAr || '',
      author: book.author || '',
      authorAr: book.authorAr || '',
      category: book.category || '',
      categoryAr: book.categoryAr || '',
      coverImage: book.coverImage || '',
      fileUrl: book.fileUrl,
      fileType: book.fileType || 'pdf',
      pages: book.pages || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الكتاب؟' : 'Are you sure you want to delete this book?')) {
      try {
        await deleteBook(id);
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      author: '',
      authorAr: '',
      category: '',
      categoryAr: '',
      coverImage: '',
      fileUrl: '',
      fileType: 'pdf',
      pages: ''
    });
  };

  const categories = [...new Set(books.map(b => b.category).filter(Boolean))];

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="library-title">
          <h1>{language === 'ar' ? 'مكتبة جيناي' : 'Jenai Library'}</h1>
          <p>{language === 'ar' ? 'اكتشف مجموعتنا من الكتب والموارد التعليمية' : 'Discover our collection of books and educational resources'}</p>
        </div>

        {isSuperAdmin && (
          <button className="add-book-btn" onClick={() => { setShowAddModal(true); setEditingBook(null); resetForm(); }}>
            {language === 'ar' ? '+ إضافة كتاب' : '+ Add Book'}
          </button>
        )}
      </div>

      <div className="library-filters">
        <input
          type="text"
          placeholder={language === 'ar' ? 'ابحث عن كتاب...' : 'Search for a book...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">{language === 'ar' ? 'جميع الأقسام' : 'All Categories'}</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="no-books">
          <span className="no-books-icon">📚</span>
          <p>{language === 'ar' ? 'لا توجد كتب متاحة حالياً' : 'No books available at the moment'}</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <div className="book-cover">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={language === 'ar' ? book.titleAr : book.title} />
                ) : (
                  <div className="book-cover-placeholder">
                    <span>📖</span>
                  </div>
                )}
                <div className="book-type-badge">{book.fileType?.toUpperCase() || 'PDF'}</div>
              </div>

              <div className="book-info">
                <h3>{language === 'ar' ? book.titleAr : book.title}</h3>
                {(book.author || book.authorAr) && (
                  <p className="book-author">
                    {language === 'ar' ? book.authorAr : book.author}
                  </p>
                )}
                {(book.description || book.descriptionAr) && (
                  <p className="book-description">
                    {language === 'ar' ? book.descriptionAr : book.description}
                  </p>
                )}
                {book.pages && (
                  <span className="book-pages">
                    {book.pages} {language === 'ar' ? 'صفحة' : 'pages'}
                  </span>
                )}
              </div>

              <div className="book-actions">
                <button className="download-btn" onClick={() => handleDownload(book)}>
                  {language === 'ar' ? 'تحميل' : 'Download'}
                </button>
                {isSuperAdmin && (
                  <>
                    <button className="edit-btn" onClick={() => handleEdit(book)}>
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(book._id)}>
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBook ? (language === 'ar' ? 'تعديل الكتاب' : 'Edit Book') : (language === 'ar' ? 'إضافة كتاب جديد' : 'Add New Book')}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="book-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'العنوان (English)' : 'Title (English)'}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'المؤلف (English)' : 'Author (English)'}</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'المؤلف (عربي)' : 'Author (Arabic)'}</label>
                  <input
                    type="text"
                    value={formData.authorAr}
                    onChange={(e) => setFormData({ ...formData, authorAr: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'الوصف (English)' : 'Description (English)'}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'القسم (English)' : 'Category (English)'}</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'القسم (عربي)' : 'Category (Arabic)'}</label>
                  <input
                    type="text"
                    value={formData.categoryAr}
                    onChange={(e) => setFormData({ ...formData, categoryAr: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'رابط الغلاف' : 'Cover Image URL'}</label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'رابط الملف' : 'File URL'}</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    required
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{language === 'ar' ? 'نوع الملف' : 'File Type'}</label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                  >
                    <option value="pdf">PDF</option>
                    <option value="epub">EPUB</option>
                    <option value="doc">DOC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'عدد الصفحات' : 'Number of Pages'}</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="submit-btn">
                  {editingBook ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
