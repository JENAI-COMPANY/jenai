import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { isMember, isAuthenticated, isAdmin } = useContext(AuthContext);
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const productId = product._id || product.id;
  const isProductFavorite = isFavorite(productId);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      localStorage.setItem('returnUrl', `/products/${productId}`);
      navigate('/login');
      return;
    }

    await toggleFavorite(productId);
  };

  // التحقق من الخصم للعملاء العاديين
  const hasCustomerDiscount = product.customerDiscount?.enabled || false;
  const customerDiscountPercentage = product.customerDiscount?.discountPercentage || 0;

  // التحقق من الخصم للأعضاء
  const hasSubscriberDiscount = product.subscriberDiscount?.enabled || false;
  const subscriberDiscountPercentage = product.subscriberDiscount?.discountPercentage || 0;

  // التحقق من نفاد المخزون
  const isOutOfStock = product.isOutOfStock || product.stock === 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store the current product page URL to return after login
      localStorage.setItem('returnUrl', `/products/${product.id || product._id}`);
      navigate('/login');
      return;
    }

    if (product.stock <= 0) {
      alert(language === 'ar' ? 'المنتج غير متوفر حالياً' : 'Product out of stock');
      return;
    }

    addToCart(product);
    alert(language === 'ar' ? 'تمت إضافة المنتج إلى السلة!' : 'Product added to cart!');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product.id || product._id}`)}>
      {/* Badges */}
      <div className="badges-container">
        {/* نفاد المخزون - أعلى أولوية */}
        {isOutOfStock && (
          <div className="badge out-of-stock-badge">
            {language === 'ar' ? 'نفذ من المخزون' : 'Out of Stock'}
          </div>
        )}

        {/* خصم العملاء العاديين */}
        {!isOutOfStock && hasCustomerDiscount && !(isMember || isAdmin) && (
          <div className="badge discount-badge customer-discount">
            {language === 'ar' ? `خصم ${customerDiscountPercentage}%` : `${customerDiscountPercentage}% OFF`}
          </div>
        )}

        {/* خصم الأعضاء */}
        {!isOutOfStock && hasSubscriberDiscount && (isMember || isAdmin) && (
          <div className="badge discount-badge subscriber-discount">
            {language === 'ar' ? `خصم ${subscriberDiscountPercentage}%` : `${subscriberDiscountPercentage}% OFF`}
          </div>
        )}

        {/* وصل حديثاً */}
        {!isOutOfStock && product.isNewArrival && (
          <div className="badge new-arrival-badge">
            {language === 'ar' ? 'وصل حديثاً' : 'New Arrival'}
          </div>
        )}

        {/* عرض خاص */}
        {!isOutOfStock && product.isOnSale && (
          <div className="badge sale-badge">
            {language === 'ar' ? 'عرض خاص' : 'Sale'}
          </div>
        )}

        {/* كمية قليلة */}
        {!isOutOfStock && product.stock > 0 && product.stock < 10 && (
          <div className="badge low-stock-badge">
            {language === 'ar' ? `باقي ${product.stock}` : `Only ${product.stock} left`}
          </div>
        )}
      </div>

      {/* Favorite Button */}
      <button
        className={`favorite-btn ${isProductFavorite ? 'active' : ''}`}
        onClick={handleToggleFavorite}
        title={isProductFavorite ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (language === 'ar' ? 'إضافة للمفضلة' : 'Add to favorites')}
      >
        {isProductFavorite ? '❤️' : '🤍'}
      </button>

      <div className="product-image">
        {product.images && product.images[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        {/* Region */}
        {product.region && (
          <div className="product-region">
            <span className="region-icon">📍</span>
            <span className="region-name">
              {language === 'ar' ? product.region.nameAr : product.region.nameEn}
            </span>
          </div>
        )}

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="product-rating">
            <div className="stars">{renderStars(Math.round(product.averageRating))}</div>
            <span className="rating-text">
              {product.averageRating.toFixed(1)} ({product.totalReviews})
            </span>
          </div>
        )}

        {product.description && (
          <p className="product-description">
            {product.description.substring(0, 100)}...
          </p>
        )}

        {/* Sold Count */}
        {product.soldCount > 0 && (
          <div className="sold-count">
            {language === 'ar'
              ? `تم بيع ${product.soldCount} قطعة`
              : `${product.soldCount} sold`}
          </div>
        )}

        <div className="product-footer">
          <div className="product-price">
            {(isMember || isAdmin) ? (
              <>
                {/* سعر الأعضاء */}
                {hasSubscriberDiscount ? (
                  <>
                    {/* إذا كان هناك خصم للأعضاء: يظهر السعر المخفض + السعر الأصلي مشطوب */}
                    <div className="member-pricing">
                      <span className="price">₪{product.subscriberDiscount.discountedPrice?.toFixed(2)}</span>
                      <span className="original-price">₪{product.subscriberDiscount.originalPrice?.toFixed(2)}</span>
                      {/* إظهار سعر الزبون للمقارنة */}
                      {product.customerPrice && product.customerPrice !== product.subscriberDiscount.discountedPrice && (
                        <div className="non-member-price-info">
                          <span className="price-label">
                            {language === 'ar' ? 'سعر الزبون الغير عضو' : 'Non-member price'}
                          </span>
                          <span className="original-price">₪{product.customerPrice?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* إذا لم يكن هناك خصم: السعر العادي + سعر الزبون مشطوب للمقارنة */}
                    <div className="member-pricing">
                      <span className="price">₪{product.subscriberPrice?.toFixed(2)}</span>
                      {product.customerPrice && product.customerPrice !== product.subscriberPrice && (
                        <div className="non-member-price-info">
                          <span className="price-label">
                            {language === 'ar' ? 'سعر الزبون الغير عضو' : 'Non-member price'}
                          </span>
                          <span className="original-price">₪{product.customerPrice?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* سعر الزبائن */}
                {hasCustomerDiscount ? (
                  <>
                    {/* إذا كان هناك خصم للزبائن: يظهر السعر المخفض + السعر الأصلي مشطوب */}
                    <span className="price">₪{product.customerDiscount.discountedPrice?.toFixed(2)}</span>
                    <span className="original-price">₪{product.customerDiscount.originalPrice?.toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    {/* إذا لم يكن هناك خصم: السعر العادي */}
                    <span className="price">₪{product.customerPrice?.toFixed(2)}</span>
                  </>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="add-to-cart-btn"
            disabled={isOutOfStock}
          >
            {isOutOfStock
              ? (language === 'ar' ? 'نفذت الكمية' : 'Out of Stock')
              : t('addToCart')}
          </button>
        </div>

        {/* Points - Only for members and admins */}
        {product.points > 0 && (isMember || isAdmin) && (
          <div className="product-points">
            {language === 'ar'
              ? `${product.points} نقطة`
              : `${product.points} points`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
