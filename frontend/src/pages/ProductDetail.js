import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FavoritesContext } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import CreateOrderForUser from '../components/CreateOrderForUser';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { isSubscriber, isAuthenticated, isAdmin, isSuperAdmin, isSalesEmployee } = useContext(AuthContext);
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const touchStartX = useRef(null);

  // Deep-parse nested JSON strings (handles multiple JSON.stringify layers)
  const parseOptions = (options) => {
    if (!options) return [];
    const current = Array.isArray(options) ? options : [options];
    const result = [];
    for (const item of current) {
      let val = item;
      for (let i = 0; i < 10; i++) {
        if (typeof val !== 'string') break;
        const trimmed = val.trim();
        if (!trimmed.startsWith('[') && !trimmed.startsWith('"') && !trimmed.startsWith('{')) break;
        try { val = JSON.parse(trimmed); } catch { break; }
      }
      if (Array.isArray(val)) {
        result.push(...parseOptions(val));
      } else if (typeof val === 'string' && val.trim()) {
        result.push(val.trim());
      }
    }
    return result;
  };

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      const productData = response.data.product || response.data;
      setProduct(productData);

      // Fetch related products from the same category
      if (productData.category) {
        const relatedResponse = await axios.get(
          `/api/products?category=${productData.category}&limit=4`
        );
        const filtered = relatedResponse.data.products.filter(p => p._id !== id);
        setRelatedProducts(filtered.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert(language === 'ar' ? 'فشل في تحميل المنتج' : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id, language]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store the current product page URL to return after login
      localStorage.setItem('returnUrl', `/products/${id}`);
      navigate('/login');
      return;
    }

    if (!product || product.stock <= 0) {
      alert(language === 'ar' ? 'المنتج غير متوفر حالياً' : 'Product out of stock');
      return;
    }

    // Validate color selection if required
    if (product.hasColorOptions && product.colors && product.colors.length > 0 && !selectedColor) {
      alert(language === 'ar' ? 'يرجى اختيار اللون' : 'Please select a color');
      return;
    }

    // Validate size selection if required
    if (product.hasSizeOptions && product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert(language === 'ar' ? 'يرجى اختيار النمرة' : 'Please select a size');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, 1, selectedColor, selectedSize);
    }
    alert(language === 'ar' ? `تمت إضافة ${quantity} قطعة إلى السلة!` : `${quantity} item(s) added to cart!`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/reviews/product/${id}`,
        { rating, comment: reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(language === 'ar' ? 'تم إرسال التقييم بنجاح!' : 'Review submitted successfully!');
      setReviewText('');
      setRating(5);
      fetchProduct(); // Refresh product to show new review
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(language === 'ar' ? 'فشل في إضافة المراجعة' : 'Failed to submit review');
    }
  };

  const renderStars = (ratingValue, interactive = false, size = 'medium') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= ratingValue ? 'filled' : ''} ${size}`}
          onClick={interactive ? () => setRating(i) : undefined}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>{language === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}</h2>
        <button onClick={() => navigate('/products-page')}>
          {language === 'ar' ? 'العودة إلى المنتجات' : 'Back to Products'}
        </button>
      </div>
    );
  }


  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
          <span> / </span>
          <span onClick={() => navigate('/products-page')} style={{ cursor: 'pointer' }}>
            {language === 'ar' ? 'المنتجات' : 'Products'}
          </span>
          <span> / </span>
          <span>{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="product-detail-main">
          {/* Image Gallery */}
          <div className="product-images">
            <div
              className="main-image"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                const mediaList = product.media && product.media.length > 0
                  ? product.media
                  : (product.images || []).map(img => ({ type: 'image', url: img }));
                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    setSelectedImage(i => Math.min(i + 1, mediaList.length - 1));
                  } else {
                    setSelectedImage(i => Math.max(i - 1, 0));
                  }
                }
                touchStartX.current = null;
              }}
            >
              {(() => {
                // دعم النظام الجديد (media) والقديم (images) - مع الصور والفيديوهات
                const mediaList = product.media && product.media.length > 0
                  ? product.media
                  : (product.images || []).map(img => ({ type: 'image', url: img }));

                const currentMedia = mediaList[selectedImage];
                const mediaUrl = typeof currentMedia === 'string' ? currentMedia : currentMedia?.url;
                const mediaType = typeof currentMedia === 'string' ? 'image' : currentMedia?.type;

                return mediaUrl ? (
                  mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                      {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support video playback'}
                    </video>
                  ) : (
                    <img src={mediaUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <div className="no-image">
                    {language === 'ar' ? 'لا توجد صورة' : 'No Image'}
                  </div>
                );
              })()}
            </div>
            {(() => {
              // دعم النظام الجديد (media) والقديم (images) - مع الصور والفيديوهات
              const mediaList = product.media && product.media.length > 0
                ? product.media
                : (product.images || []).map(img => ({ type: 'image', url: img }));

              return mediaList.length > 1 && (
                <>
                <div className="image-dots">
                  {mediaList.map((_, index) => (
                    <div
                      key={index}
                      className={`image-dot ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
                <div className="image-thumbnails">
                  {mediaList.map((item, index) => {
                    const mediaUrl = typeof item === 'string' ? item : item?.url;
                    const mediaType = typeof item === 'string' ? 'image' : item?.type;
                    return (
                      <div
                        key={index}
                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                      >
                        {mediaType === 'video' ? (
                          <div style={{
                            width: '100%', height: '100%',
                            background: '#222',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <span style={{ fontSize: '28px', color: 'white' }}>▶</span>
                          </div>
                        ) : (
                          <img src={mediaUrl} alt={`${product.name} ${index + 1}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            <div className="product-title-row">
              <h1 className="product-title">{product.name}</h1>
              {isAuthenticated && (
                <button
                  className={`favorite-btn-detail ${isFavorite(product._id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(product._id)}
                  title={language === 'ar' ? 'إضافة للمفضلة' : 'Add to Favorites'}
                >
                  {isFavorite(product._id) ? '❤️' : '🤍'}
                </button>
              )}
            </div>

            {/* Rating and Sales */}
            <div className="product-meta">
              {product.averageRating > 0 && (
                <div className="rating-display">
                  <div className="stars">{renderStars(Math.round(product.averageRating || 0))}</div>
                  <span className="rating-text">
                    {(product.averageRating || 0).toFixed(1)} ({product.totalReviews || 0}{' '}
                    {language === 'ar' ? 'تقييم' : 'reviews'})
                  </span>
                </div>
              )}
              {product.soldCount > 0 && (
                <div className="sold-info">
                  {language === 'ar'
                    ? `تم بيع ${product.soldCount} قطعة`
                    : `${product.soldCount} sold`}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="product-badges">
              {product.isNewArrival && (
                <span className="badge new-arrival">
                  {language === 'ar' ? 'وصل حديثاً' : 'New Arrival'}
                </span>
              )}
              {product.isOnSale && (
                <span className="badge sale">
                  {language === 'ar' ? 'عرض خاص' : 'Sale'}
                </span>
              )}
              {product.isFeatured && (
                <span className="badge featured">
                  {language === 'ar' ? 'مميز' : 'Featured'}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="price-section">
              {(isSubscriber || isAdmin) ? (
                <div className="subscriber-pricing">
                  {product.subscriberDiscount?.enabled && product.subscriberDiscount?.discountedPrice ? (
                    <>
                      {/* إذا كان هناك خصم للأعضاء */}
                      <div className="current-price">₪{product.subscriberDiscount.discountedPrice.toFixed(2)}</div>
                      <div className="original-price">₪{product.subscriberDiscount.originalPrice.toFixed(2)}</div>
                      <div className="discount-badge">
                        {language === 'ar' ? `توفير ${product.subscriberDiscount.discountPercentage}%` : `Save ${product.subscriberDiscount.discountPercentage}%`}
                      </div>
                      {/* إظهار سعر الزبون للمقارنة */}
                      {product.customerPrice && product.customerPrice !== product.subscriberDiscount.discountedPrice && (
                        <div className="non-member-price-container">
                          <div className="non-member-price-label">
                            {language === 'ar' ? 'سعر الزبون الغير عضو' : 'Non-member price'}
                          </div>
                          <div className="original-price">₪{product.customerPrice.toFixed(2)}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* إذا لم يكن هناك خصم: السعر العادي + سعر الزبون للمقارنة */}
                      <div className="current-price">₪{(product.subscriberPrice || 0).toFixed(2)}</div>
                      {product.customerPrice && product.customerPrice !== product.subscriberPrice && (
                        <div className="non-member-price-container">
                          <div className="non-member-price-label">
                            {language === 'ar' ? 'سعر الزبون الغير عضو' : 'Non-member price'}
                          </div>
                          <div className="original-price">₪{product.customerPrice.toFixed(2)}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="customer-pricing">
                  {product.customerDiscount?.enabled && product.customerDiscount?.discountedPrice ? (
                    <>
                      {/* إذا كان هناك خصم للزبائن */}
                      <div className="current-price">₪{product.customerDiscount.discountedPrice.toFixed(2)}</div>
                      <div className="original-price">₪{product.customerDiscount.originalPrice.toFixed(2)}</div>
                      <div className="discount-badge">
                        {language === 'ar' ? `توفير ${product.customerDiscount.discountPercentage}%` : `Save ${product.customerDiscount.discountPercentage}%`}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* إذا لم يكن هناك خصم: السعر العادي */}
                      <div className="current-price">₪{(product.customerPrice || 0).toFixed(2)}</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="stock-info">
              {product.stock <= 0 ? (
                <span className="out-of-stock">
                  {language === 'ar' ? '❌ نفذت الكمية' : '❌ Out of Stock'}
                </span>
              ) : product.stock < 10 ? (
                <span className="low-stock">
                  {language === 'ar' ? `⚠️ باقي ${product.stock} فقط` : `⚠️ Only ${product.stock} left`}
                </span>
              ) : (
                <span className="in-stock">
                  {language === 'ar' ? '✓ متوفر في المخزون' : '✓ In Stock'}
                </span>
              )}
            </div>

            {/* Weight */}
            {product.weight && (
              <div className="weight-info" style={{ margin: '10px 0', color: '#666', fontSize: '14px' }}>
                ⚖️ {language === 'ar' ? 'الوزن:' : 'Weight:'} {product.weight}
              </div>
            )}

            {/* Points - Only for subscribers and admins */}
            {product.points > 0 && (isSubscriber || isAdmin) && (
              <div className="points-info">
                🎁 {language === 'ar' ? 'ستحصل على' : 'Earn'} {product.points}{' '}
                {language === 'ar' ? 'نقطة' : 'points'}
              </div>
            )}

            {/* Stock Details - Only for members and admins */}
            {(isSubscriber || isAdmin) && (
              <div className="stock-details-box">
                <h4>{language === 'ar' ? '📦 تفاصيل المخزون' : '📦 Stock Details'}</h4>
                <div className="stock-details-grid">
                  <div className="stock-detail-item">
                    <span className="stock-label">{language === 'ar' ? 'الكمية الأصلية:' : 'Original Qty:'}</span>
                    <span className="stock-value original">{(product.stock || 0) + (product.soldCount || 0)}</span>
                  </div>
                  <div className="stock-detail-item">
                    <span className="stock-label">{language === 'ar' ? 'تم بيعها:' : 'Sold:'}</span>
                    <span className="stock-value sold">{product.soldCount || 0}</span>
                  </div>
                  <div className="stock-detail-item">
                    <span className="stock-label">{language === 'ar' ? 'المتبقي:' : 'Remaining:'}</span>
                    <span className={`stock-value remaining ${product.stock < 10 ? 'low' : ''}`}>{product.stock || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="purchase-section">
              {/* خيارات اللون */}
              {product.hasColorOptions && product.colors && product.colors.length > 0 && (() => {
                const colors = parseOptions(product.colors);
                return colors.length > 0 ? (
                  <div className="product-options-selector">
                    <label>{language === 'ar' ? '🎨 اللون:' : '🎨 Color:'}</label>
                    <div className="options-buttons">
                      {colors.map((color, index) => (
                        <button
                          key={index}
                          className={`option-button ${selectedColor === color ? 'selected' : ''}`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* خيارات النمرة/المقاس */}
              {product.hasSizeOptions && product.sizes && product.sizes.length > 0 && (() => {
                const sizes = parseOptions(product.sizes);
                return sizes.length > 0 ? (
                  <div className="product-options-selector">
                    <label>{language === 'ar' ? '📏 النمرة/المقاس:' : '📏 Size:'}</label>
                    <div className="options-buttons">
                      {sizes.map((size, index) => (
                        <button
                          key={index}
                          className={`option-button ${selectedSize === size ? 'selected' : ''}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="purchase-row">
                <div className="quantity-selector">
                  <label>{language === 'ar' ? 'الكمية:' : 'Quantity:'}</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0
                    ? language === 'ar'
                      ? 'نفذت الكمية'
                      : 'Out of Stock'
                    : language === 'ar'
                    ? 'إضافة إلى السلة'
                    : 'Add to Cart'}
                </button>
              </div>

              {/* Create Order for User - Super Admin + Sales Employee Only */}
              {(isSuperAdmin || isSalesEmployee) && (
                <button
                  className="create-order-for-user-button"
                  onClick={() => setShowCreateOrderModal(true)}
                  disabled={product.stock <= 0}
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: product.stock <= 0 ? 0.6 : 1
                  }}
                >
                  {language === 'ar' ? 'إنشاء طلبية لعضو/زبون' : 'Create Order for User'}
                </button>
              )}
            </div>

            {/* Category and Region */}
            <div className="product-additional-info">
              <div className="info-item">
                <strong>{language === 'ar' ? 'الفئة:' : 'Category:'}</strong> {product.category}
              </div>
              {product.region && (
                <div className="info-item">
                  <strong>{language === 'ar' ? 'المنطقة:' : 'Region:'}</strong>{' '}
                  {typeof product.region === 'string'
                    ? product.region
                    : (language === 'ar' ? (product.region.nameAr || product.region.name) : (product.region.nameEn || product.region.name))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-tabs">
          <div className="tab-headers">
            <button
              className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              {language === 'ar' ? 'الوصف' : 'Description'}
            </button>
            <button
              className={`tab-header ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              {language === 'ar' ? 'التقييمات' : 'Reviews'} ({product.totalReviews || 0})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-tab">
                <p>{product.description}</p>
                {product.allowCustomOrder && (
                  <div className="custom-order-info">
                    <h3>{language === 'ar' ? '🎨 طلب مخصص' : '🎨 Custom Order'}</h3>
                    <p>
                      {language === 'ar'
                        ? `يمكنك طلب هذا المنتج بشكل مخصص. العربون المطلوب: ₪${product.customOrderDeposit?.toFixed(2)}`
                        : `This product is available for custom orders. Deposit required: ₪${product.customOrderDeposit?.toFixed(2)}`}
                    </p>
                    {product.estimatedDeliveryDays && (
                      <p>
                        {language === 'ar'
                          ? `مدة التسليم المتوقعة: ${product.estimatedDeliveryDays} يوم`
                          : `Estimated delivery: ${product.estimatedDeliveryDays} days`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                {/* Submit Review Form */}
                {isAuthenticated && (
                  <div className="submit-review">
                    <h3>{language === 'ar' ? 'أضف تقييمك' : 'Submit Your Review'}</h3>
                    <form onSubmit={handleSubmitReview} autoComplete="off">
                      <div className="rating-input">
                        <label>{language === 'ar' ? 'التقييم:' : 'Rating:'}</label>
                        <div className="stars-input">{renderStars(rating, true, 'large')}</div>
                      </div>
                      <div className="review-text-input">
                        <label>{language === 'ar' ? 'تعليقك:' : 'Your Review:'}</label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder={
                            language === 'ar'
                              ? 'شارك تجربتك مع هذا المنتج...'
                              : 'Share your experience with this product...'
                          }
                          rows="4"
                          required
                        ></textarea>
                      </div>
                      <button type="submit" className="submit-review-btn">
                        {language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <strong>{review.userName || review.user?.name || 'مستخدم'}</strong>
                            <div className="review-rating">{renderStars(review.rating)}</div>
                          </div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-reviews">
                      {language === 'ar'
                        ? 'لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!'
                        : 'No reviews yet. Be the first to review this product!'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>{language === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}</h2>
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}

        {/* Create Order for User Modal */}
        {showCreateOrderModal && (
          <CreateOrderForUser
            product={product}
            onClose={() => setShowCreateOrderModal(false)}
            onSuccess={() => {
              setShowCreateOrderModal(false);
              alert(language === 'ar' ? 'تم إنشاء الطلبية بنجاح!' : 'Order created successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
