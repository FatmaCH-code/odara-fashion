import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useProducts } from '../hooks/useProducts'

export default function ProductPage() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const addToCart = useCartStore(state => state.addItem)
  const { products: allProducts } = useProducts()

  const product = allProducts.find(p => p.id === parseInt(id)) || allProducts[0]
  const gallery = product.images && product.images.length > 0 ? product.images : [product.image]

  // Reset back to the cover photo (and cleared size) whenever we land on a different product.
  useEffect(() => { setActiveImage(0); setSelectedSize(null) }, [product.id])

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size')
      return
    }
    addToCart({
      id: product.id,
      name: selectedSize ? `${product.name} (Size ${selectedSize})` : product.name,
      price: product.price,
      quantity
    })
    alert('Added to cart!')
  }

  return (
    <div>
      <div className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image gallery */}
            <div>
              <div className="product-image-wrapper" style={{ paddingTop: '110%' }}>
                <img src={gallery[activeImage]} alt={product.name} className="product-image-photo" />
              </div>
              {gallery.length > 1 && (
                <div className="product-gallery-thumbs">
                  {gallery.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`product-gallery-thumb ${i === activeImage ? 'active' : ''}`}
                    >
                      <img src={url} alt={`${product.name} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <p className="product-category-label">{product.category}</p>
              <h1 className="text-4xl font-playfair text-2C2C2C mb-4">{product.name}</h1>
              <p className="text-3xl text-C9A876 font-semibold mb-6">
                ${product.price}
                {product.originalPrice && (
                  <span className="ml-3 text-xl line-through text-2C2C2C/40">${product.originalPrice}</span>
                )}
              </p>
              
              <p className="text-lg text-2C2C2C/70 mb-8">{product.description}</p>

              {product.colors && product.colors.length > 0 && (
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4">
                    Color{product.colors.length > 1 ? 's' : ''} available
                  </label>
                  <div className="flex items-center gap-3">
                    {product.colors.map((c, i) => (
                      <span
                        key={c.name}
                        className="product-color-dot"
                        style={{
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          boxShadow: i === 0 ? '0 0 0 2px #C9A876' : undefined,
                          backgroundColor: c.hex,
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4">
                    Size {selectedSize ? `— ${selectedSize}` : ''}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`product-size-chip ${selectedSize === s ? 'is-selected' : ''}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm uppercase tracking-widest font-semibold mb-4">Quantity</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-6 py-3 border border-E8D9C4 text-2C2C2C hover:bg-F5EFE0"
                  >
                    -
                  </button>
                  <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-6 py-3 border border-E8D9C4 text-2C2C2C hover:bg-F5EFE0"
                  >
                    +
                  </button>
                </div>
              </div>

              <button onClick={handleAddToCart} className="btn-gold w-full mb-4">Add to Cart</button>
              <button className="btn-outline w-full">Wishlist</button>

              <div className="mt-12 pt-8 border-t border-E8D9C4">
                <h3 className="font-playfair text-xl mb-4">Product Details</h3>
                <ul className="space-y-2 text-sm text-2C2C2C/70">
                  <li>• Premium materials</li>
                  <li>• Made to last</li>
                  <li>• Sustainable sourcing</li>
                  <li>• Free returns within 30 days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
