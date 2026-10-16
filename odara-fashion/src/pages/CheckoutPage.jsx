import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { createOrder } from '../services/orders'
import { validatePromo } from '../services/promo'

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const clearCart = useCartStore(state => state.clearCart)

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', postal: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState(null) // { code, percent } once a valid code is applied
  const [promoMsg, setPromoMsg] = useState('')

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discount = promo ? Math.round(subtotal * promo.percent) / 100 : 0
  const total = subtotal - discount

  const applyPromo = async (code) => {
    setPromoMsg('')
    const res = await validatePromo(code, form.email)
    if (res.valid) {
      setPromo({ code: res.code, percent: Number(res.percent) })
      setPromoInput('')
    } else {
      setPromo(null)
      setPromoMsg(res.message || 'That code is not valid.')
    }
  }

  // The popup's code is applied automatically.
  useEffect(() => {
    let saved = null
    try { saved = localStorage.getItem('odara-promo') } catch { /* private mode */ }
    if (saved) applyPromo(saved)
  }, [])
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const order = await createOrder({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: `${form.address}, ${form.city} ${form.postal}`,
        items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        promoCode: promo ? promo.code : null,
      })
      if (order?.redirectUrl) {
        // Payments enabled — send them to Stripe's hosted checkout page.
        // Cart is cleared on return (order-success) rather than here, in case
        // they cancel and come back.
        window.location.href = order.redirectUrl
        return
      }
      clearCart()
      navigate('/order-success', { state: { orderNumber: order?.order_number } })
    } catch (err) {
      console.error('Order creation failed:', err)
      setError(`Something went wrong placing your order: ${err.message || 'please try again.'}`)
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C">Checkout</h1>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="md:col-span-2">
              <div className="bg-white p-8 border border-E8D9C4">
                <h2 className="text-2xl font-playfair text-2C2C2C mb-6">Shipping Address</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="Full Name" value={form.name} onChange={set('name')} required className="w-full p-3 border border-E8D9C4" />
                  <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required className="w-full p-3 border border-E8D9C4" />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} className="w-full p-3 border border-E8D9C4" />
                  <input type="text" placeholder="Address" value={form.address} onChange={set('address')} required className="w-full p-3 border border-E8D9C4" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="City" value={form.city} onChange={set('city')} required className="w-full p-3 border border-E8D9C4" />
                    <input type="text" placeholder="Postal Code" value={form.postal} onChange={set('postal')} className="w-full p-3 border border-E8D9C4" />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="pt-6">
                    <button type="submit" disabled={submitting} className="btn-gold w-full block text-center">
                      {submitting ? (paymentsEnabled ? 'Redirecting to payment…' : 'Placing Order…') : (paymentsEnabled ? 'Continue to Payment' : 'Complete Order')}
                    </button>
                    <p className="text-xs text-2C2C2C/50 text-center mt-3">
                      {paymentsEnabled
                        ? "You'll be redirected to Stripe's secure checkout to pay by card, Apple Pay or Google Pay."
                        : "Payment isn't collected online yet — we'll follow up by email/phone to confirm and arrange payment."}
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div>
              <div className="bg-F5EFE0 p-6">
                <h3 className="font-playfair text-lg mb-4">Order Summary</h3>
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-sm mb-2">
                    <span>{i.name} × {i.quantity}</span>
                    <span>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-E8D9C4 mt-4 pt-4">
                  {promo ? (
                    <div className="flex justify-between text-sm mb-3 text-2C2C2C/80">
                      <span>
                        Discount ({promo.code}){' '}
                        <button type="button" className="promo-remove" onClick={() => setPromo(null)}>remove</button>
                      </span>
                      <span>−${discount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="promo-row">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Discount code"
                          aria-label="Discount code"
                        />
                        <button type="button" onClick={() => applyPromo(promoInput)}>Apply</button>
                      </div>
                      {promoMsg && <p className="text-xs text-red-600 mt-2">{promoMsg}</p>}
                    </div>
                  )}
                </div>
                <div className="border-t border-E8D9C4 pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
