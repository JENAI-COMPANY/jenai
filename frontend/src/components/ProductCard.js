import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { isMember, isAuthenticated, isAdmin } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const hasDiscount = product.subscriberPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.subscriberPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store the current product page URL to return after login
      localStorage.setItem('returnUrl', `/products/${product._id}`);
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
    <div className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
      {/* Badges */}
      <div className="badges-container">
        {product.isNewArrival && (
          <div className="badge new-arrival-badge">
            {language === 'ar' ? 'وصل حديثاً' : 'New Arrival'}
          </div>
        )}
        {product.isOnSale && (
          <div className="badge sale-badge">
            {language === 'ar' ? 'عرض خاص' : 'Sale'}
          </div>
        )}
        {hasDiscount && !(isMember || isAdmin) && (
          <div className="badge subscriber-badge">
            {language === 'ar' ? `خصم ${discountPercentage}%` : `${discountPercentage}% OFF`}
          </div>
        )}
        {(isMember || isAdmin) && hasDiscount && (
          <div className="badge subscriber-badge active">
            {language === 'ar' ? `توفير ${discountPercentage}%` : `Save ${discountPercentage}%`}
          </div>
        )}
        {product.stock <= 0 && (
          <div className="badge out-of-stock-badge">
            {language === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="badge low-stock-badge">
            {language === 'ar' ? `باقي ${product.stock}` : `Only ${product.stock} left`}
          </div>
        )}
      </div>

      <div className="product-image">
        {product.images && product.images[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="product-rating">
            <div className="stars">{renderStars(Math.round(product.averageRating))}</div>
            <span className="rating-text">
              {product.averageRating.toFixed(1)} ({product.totalReviews})
            </span>
          </div>
        )}

        <p className="product-description">
          {product.description.substring(0, 100)}...
        </p>

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
                <span className="price">${product.subscriberPrice.toFixed(2)}</span>
                <span className="original-price">${product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="price">${product.price.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="add-to-cart-btn"
            disabled={product.stock <= 0}
          >
            {product.stock <= 0
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
