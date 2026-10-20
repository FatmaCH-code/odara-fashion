import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useReviews, summarize } from '../hooks/useReviews'
import StarRating from './StarRating'

export default function ProductCard({ product, isSale, isNew }) {
  const openQuickAdd = useUiStore(s => s.openQuickAdd)
  const { reviews } = useReviews()

  const sale = isSale ?? product.isSale
  const fresh = isNew ?? product.isNew
  const badge = sale ? ['sale', 'Sale'] : fresh ? ['new', 'New'] : product.isBest ? ['best', 'Best Seller'] : null
  const { count, average } = summarize(reviews.filter(r => r.productId === product.id))

  return (
    <div className="product-card-premium">
      {badge && <div className={`badge ${badge[0]}`}>{badge[1]}</div>}

      <div className="product-media">
        <Link to={`/product/${product.id}`} className="product-media-link" tabIndex={-1} aria-hidden="true">
          <div className="product-image-wrapper">
            <img src={product.image} alt="" className="product-image-photo" loading="lazy" />
          </div>
        </Link>

        {/* Desktop: slides up over the photo on hover. Touch screens: a round "+" in the corner. */}
        <button
          type="button"
          className="quick-add-btn"
          aria-label={`Quick add ${product.name}`}
          onClick={() => openQuickAdd(product)}
        >
          <Plus className="quick-add-icon" />
          <span className="quick-add-text">Quick add</span>
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="product-card-link">
        <div className="product-info-premium">
          <p className="product-category-label">{product.brand || product.category}</p>
          <h3 className="product-name-premium">{product.name}</h3>
          {count > 0 && (
            <p className="product-rating-line">
              <StarRating value={average} size={13} />
              <span>({count})</span>
            </p>
          )}
          <p className="product-price-premium">
            ${product.price}
            {product.originalPrice && (
              <span className="ml-2 text-sm line-through text-2C2C2C/40">${product.originalPrice}</span>
            )}
          </p>
          {product.colors && product.colors.length > 0 && (
            <div className="product-colors">
              {product.colors.map((c) => (
                <span key={c.name} className="product-color-dot" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
