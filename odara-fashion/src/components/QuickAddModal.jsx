import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { buildCartItem, sizesFor } from '../utils/cartItem'

// "Quick add" from any product card: pick color + size, add, and the bag slides open.
export default function QuickAddModal() {
  const product = useUiStore(s => s.quickAdd)
  const close = useUiStore(s => s.closeQuickAdd)
  const openCart = useUiStore(s => s.openCart)
  const showToast = useUiStore(s => s.showToast)
  const addItem = useCartStore(s => s.addItem)
  const [color, setColor] = useState(null)
  const [size, setSize] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!product) return
    setColor(product.colors && product.colors.length ? product.colors[0] : null)
    setSize(null)
    setError('')
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [product, close])

  // Picking a color that doesn't come in the chosen size clears the size.
  useEffect(() => {
    if (product && size && !sizesFor(product, color).includes(size)) setSize(null)
  }, [color])

  if (!product) return null
  const sizes = sizesFor(product, color)
  const allNames = !!(product.colors && product.colors.length > 0 && product.colors.every(c => !c.hex))

  const add = () => {
    if (sizes.length > 0 && !size) {
      setError('Please choose a size')
      showToast('Pick a size to continue.', { type: 'error', title: 'Size needed' })
      return
    }
    addItem(buildCartItem(product, color, size, 1))
    close()
    showToast(`${product.name} is in your bag.`, { title: 'Added to bag' })
    openCart()
  }

  return createPortal(
    <div className="qa-overlay" role="dialog" aria-modal="true" aria-label={`Add ${product.name} to bag`}>
      <div className="qa-backdrop" onClick={close} />
      <div className="qa-card">
        <button type="button" className="qa-close" onClick={close} aria-label="Close"><X className="w-5 h-5" /></button>
        <img src={(color && color.image) || product.image} alt={product.name} className="qa-img" />
        <div className="qa-body">
          <p className="qa-cat">{product.brand || product.category}</p>
          <h3 className="qa-name">{product.name}</h3>
          <p className="qa-price">
            ${product.price}
            {product.originalPrice && <span>${product.originalPrice}</span>}
          </p>

          {product.colors && product.colors.length > 0 && (
            <div className="qa-group">
              <p className="qa-label">{allNames ? 'Name' : 'Color'}{color ? ` — ${color.name}` : ''}</p>
              <div className="qa-colors">
                {product.colors.map(c => c.hex ? (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    className={`qa-color ${color && color.name === c.name ? 'is-selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c)}
                  />
                ) : (
                  <button key={c.name} type="button" className={`product-size-chip ${color && color.name === c.name ? 'is-selected' : ''}`} onClick={() => setColor(c)}>{c.name}</button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="qa-group">
              <p className="qa-label">Size{size ? ` — ${size}` : ''}</p>
              <div className="qa-sizes">
                {sizes.map(s => (
                  <button key={s} type="button" className={`product-size-chip ${size === s ? 'is-selected' : ''}`} onClick={() => { setSize(s); setError('') }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="qa-error" role="alert">{error}</p>}
          <button type="button" className="btn-gold qa-add" onClick={add}>Add to bag</button>
          <Link to={`/product/${product.id}`} className="qa-details" onClick={close}>View full details</Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
