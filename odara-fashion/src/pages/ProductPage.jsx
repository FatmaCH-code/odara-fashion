import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useProducts } from '../hooks/useProducts'
import { useUiStore } from '../store/uiStore'
import { buildCartItem, sizesFor } from '../utils/cartItem'
import ProductReviews from '../components/ProductReviews'
import StarRating from '../components/StarRating'
import { useReviews, summarize } from '../hooks/useReviews'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function ProductPage() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [sizeError, setSizeError] = useState('')
  const addToCart = useCartStore(state => state.addItem)
  const openCart = useUiStore(state => state.openCart)
  const showToast = useUiStore(state => state.showToast)
  const { reviews } = useReviews()
  const { settings } = useSiteSettings()
  const { products: allProducts } = useProducts()

  const product = allProducts.find(p => p.id === parseInt(id)) || allProducts[0]
  const gallery = product.images && product.images.length > 0 ? product.images : [product.image]

  // A color can narrow down which sizes it comes in (set in the admin); otherwise the product's sizes apply. Always in order.
  const availableSizes = sizesFor(product, selectedColor)

  // Reset selections whenever we land on a different product.
  useEffect(() => {
    setActiveImage(0)
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : null)
    setSelectedSize(null)
  }, [product.id])

  // Picking a color shows that color's own photo (set when products are merged in the admin).
  useEffect(() => {
    const img = selectedColor && selectedColor.image
    const i = img ? gallery.indexOf(img) : -1
    if (i >= 0) setActiveImage(i)
  }, [selectedColor])

  // If switching color makes the currently-picked size unavailable, clear it.
  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize(null)
    }
  }, [selectedColor])

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError('Please choose a size')
      showToast('Pick a size to continue.', { type: 'error', title: 'Size needed' })
      return
    }
    addToCart(buildCartItem(product, selectedColor, selectedSize, quantity))
    setSizeError('')
    showToast(`${product.name} is in your bag.`, { title: 'Added to bag' })
    openCart()
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
              <p className="product-category-label">{product.brand ? `${product.brand} · ${product.category}` : product.category}</p>
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
                    Color{selectedColor ? ` — ${selectedColor.name}` : ''}
                  </label>
                  <div className="flex items-center gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className="product-color-dot"
                        style={{
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          boxShadow: selectedColor?.name === c.name ? '0 0 0 2px #C9A876' : undefined,
                          backgroundColor: c.hex,
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {availableSizes.length > 0 && (
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4">
                    Size {selectedSize ? `— ${selectedSize}` : ''}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setSelectedSize(s); setSizeError('') }}
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

              {sizeError && <p className="qa-error" role="alert">{sizeError}</p>}
              <button onClick={handleAddToCart} className="btn-gold w-full mb-4">Add to Cart</button>

              <div className="mt-12 pt-8 border-t border-E8D9C4">
                <h3 className="font-playfair text-xl mb-4">Product Details</h3>
                <ul className="space-y-2 text-sm text-2C2C2C/70">
                  <li>• {product.brand ? `${product.brand} · ${product.category}` : product.category}</li>
                  {(product.sizes && product.sizes.length > 0) && <li>• Sizes available: {sizesFor(product, null).join(', ')}</li>}
                  {Number(settings.shipping.freeOver) > 0 && Number(settings.shipping.flatFee) > 0 && <li>• Free shipping on orders over ${Number(settings.shipping.freeOver)}</li>}
                </ul>
              </div>
            </div>
          </div>
          <ProductReviews product={product} />
        </div>
      </div>
    </div>
  )
}
