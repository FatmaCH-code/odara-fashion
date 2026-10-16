import { Link } from 'react-router-dom'

export default function ProductCard({ product, isSale, isNew }) {
  const sale = isSale ?? product.isSale
  const fresh = isNew ?? product.isNew
  const badge = sale ? ['sale', 'Sale'] : fresh ? ['new', 'New'] : product.isBest ? ['best', 'Best Seller'] : null
  return (
    <Link to={`/product/${product.id}`}>
      <div className="product-card-premium">
        {badge && <div className={`badge ${badge[0]}`}>{badge[1]}</div>}
        <div className="product-image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-image-photo"
            loading="lazy"
          />
        </div>
        <div className="product-info-premium">
          <p className="product-category-label">{product.brand || product.category}</p>
          <h3 className="product-name-premium">{product.name}</h3>
          <p className="product-price-premium">
            ${product.price}
            {product.originalPrice && (
              <span className="ml-2 text-sm line-through text-2C2C2C/40">${product.originalPrice}</span>
            )}
          </p>
          {product.colors && product.colors.length > 0 && (
            <div className="product-colors">
              {product.colors.map((c) => (
                <span
                  key={c.name}
                  className="product-color-dot"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
