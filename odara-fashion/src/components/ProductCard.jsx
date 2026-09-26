import { Link } from 'react-router-dom'

export default function ProductCard({ product, isSale, isNew }) {
  return (
    <Link to={`/product/${product.id}`}>
      <div className="product-card-premium">
        {(isSale || isNew) && (
          <div className={`badge ${isSale ? 'sale' : 'new'}`}>
            {isSale ? 'Sale' : 'New'}
          </div>
        )}
        <div className="product-image-wrapper">
          <img
            src={product.image}
            alt={product.name}
            className="product-image-photo"
            loading="lazy"
          />
        </div>
        <div className="product-info-premium">
          <p className="product-category-label">{product.category}</p>
          <h3 className="product-name-premium">{product.name}</h3>
          <p className="product-price-premium">
            ${product.price}
            {product.originalPrice && (
              <span className="ml-2 text-sm line-through text-2C2C2C/40">${product.originalPrice}</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  )
}
