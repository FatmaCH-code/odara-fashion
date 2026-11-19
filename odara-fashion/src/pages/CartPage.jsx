import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCartStore, getLineId } from '../store/cartStore'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { shippingFor } from '../utils/pricing'
import { useBogo } from '../hooks/useBogo'

export default function CartPage() {
  const { items, removeItem } = useCartStore()

  const { settings } = useSiteSettings()
  const bogo = useBogo(items)
  const fullSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const subtotal = fullSubtotal - bogo.amount
  const shipping = shippingFor(subtotal, settings.shipping)
  const freeOver = Number(settings.shipping.freeOver || 0)

  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Shopping Cart</h1>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2C2C2C/70 text-lg mb-6">Your cart is empty</p>
              <Link to="/shop" className="btn-gold">Continue Shopping</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map(item => {
                    const free = bogo.freeByLine[getLineId(item)] || 0
                    return (
                    <div key={getLineId(item)} className="flex items-center justify-between p-6 border border-E8D9C4">
                      <div>
                        <h3 className="font-playfair text-xl text-2C2C2C">{item.name}</h3>
                        <p className="text-2C2C2C/60">Qty: {item.quantity}{free > 0 && <span className="free-tag">{free === item.quantity ? 'Free gift' : `${free} free`}</span>}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="font-semibold text-2C2C2C">
                          {free > 0 && <s className="text-2C2C2C/40 font-normal mr-2">${(item.price * item.quantity).toFixed(2)}</s>}
                          ${(item.price * (item.quantity - free)).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(getLineId(item))}
                          className="p-2 hover:bg-F5EFE0 transition"
                        >
                          <Trash2 className="w-5 h-5 text-C9A876" />
                        </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-F5EFE0 p-8 h-fit">
                <h3 className="text-2xl font-playfair text-2C2C2C mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {bogo.amount > 0 && (
                    <div className="flex justify-between text-2C2C2C/70">
                      <span>Buy one, get one free</span>
                      <span>−${bogo.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {bogo.active && bogo.unclaimed > 0 && (
                    <p className="text-xs text-C9A876">
                      You've earned {bogo.unclaimed} free gift{bogo.unclaimed > 1 ? 's' : ''}:{' '}
                      {bogo.giftProducts.slice(0, 4).map((p, i) => (
                        <span key={p.id}>{i > 0 && ', '}<Link to={`/product/${p.id}`} className="underline">{p.name}</Link></span>
                      ))}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === null ? 'Calculated at checkout' : shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</span>
                  </div>
                  {shipping !== 0 && freeOver > 0 && (
                    <p className="text-xs text-2C2C2C/60">Add ${(freeOver - subtotal).toFixed(2)} more for free shipping.</p>
                  )}
                  <div className="border-t border-D4C4B0 pt-4 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-C9A876">${(subtotal + (shipping || 0)).toFixed(2)}</span>
                  </div>
                </div>
                <Link to="/checkout" className="btn-gold w-full mb-3 block text-center">Proceed to Checkout</Link>
                <Link to="/shop" className="block text-center text-C9A876 text-sm hover:text-D4C4B0">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
