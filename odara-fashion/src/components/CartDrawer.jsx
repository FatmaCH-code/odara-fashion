import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore, getLineId } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { shippingFor } from '../utils/pricing'

const money = (n) => `$${Number(n).toFixed(2)}`

// Slides in from the right after "Add to cart" — no more pop-up alerts.
export default function CartDrawer() {
  const open = useUiStore(s => s.cartOpen)
  const close = useUiStore(s => s.closeCart)
  const { items, removeItem, updateQuantity } = useCartStore()
  const { settings } = useSiteSettings()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, close])

  if (!open) return null

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = shippingFor(subtotal, settings.shipping)   // null = depends on the address (asked at checkout)
  const freeOver = Number(settings.shipping.freeOver || 0)
  const canFreeShip = freeOver > 0 && (settings.shipping.byZone !== false || Number(settings.shipping.flatFee || 0) > 0)
  const remaining = Math.max(0, freeOver - subtotal)
  const progress = canFreeShip ? Math.min(100, (subtotal / freeOver) * 100) : 0
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return createPortal(
    <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="drawer-backdrop" onClick={close} />
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2>Your bag {count > 0 && <span>({count})</span>}</h2>
          <button type="button" onClick={close} aria-label="Close bag"><X className="w-5 h-5" /></button>
        </header>

        {canFreeShip && items.length > 0 && (
          <div className="drawer-ship">
            <p>
              {remaining > 0
                ? <>Add <strong>{money(remaining)}</strong> more for <strong>free shipping</strong></>
                : <>🎉 You've unlocked <strong>free shipping</strong></>}
            </p>
            <div className="drawer-ship-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="drawer-empty">
            <ShoppingBag className="w-10 h-10" />
            <p>Your bag is empty</p>
            <Link to="/shop" className="btn-gold" onClick={close}>Start shopping</Link>
          </div>
        ) : (
          <>
            <ul className="drawer-items">
              {items.map(item => {
                const lineId = getLineId(item)
                return (
                  <li key={lineId} className="drawer-item">
                    {item.image ? <img src={item.image} alt="" /> : <div className="drawer-item-ph" />}
                    <div className="drawer-item-main">
                      <p className="drawer-item-name">{item.name}</p>
                      <p className="drawer-item-price">{money(item.price)}</p>
                      <div className="drawer-qty">
                        <button type="button" aria-label="Fewer" onClick={() => updateQuantity(lineId, item.quantity - 1)}><Minus className="w-3.5 h-3.5" /></button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="More" onClick={() => updateQuantity(lineId, item.quantity + 1)}><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <button type="button" className="drawer-remove" aria-label="Remove" onClick={() => removeItem(lineId)}><Trash2 className="w-4 h-4" /></button>
                  </li>
                )
              })}
            </ul>

            <footer className="drawer-foot">
              <div className="drawer-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="drawer-row drawer-row-muted"><span>Shipping</span><span>{shipping === null ? 'Calculated at checkout' : shipping > 0 ? money(shipping) : 'Free'}</span></div>
              <Link to="/checkout" className="btn-gold drawer-checkout" onClick={close}>Checkout · {money(subtotal + (shipping || 0))}</Link>
              <Link to="/cart" className="drawer-viewbag" onClick={close}>View bag</Link>
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body
  )
}
