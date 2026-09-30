import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { createOrder } from '../services/orders'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const clearCart = useCartStore(state => state.clearCart)

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', postal: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
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
        total,
      })
      clearCart()
      navigate('/order-success', { state: { orderNumber: order?.order_number } })
    } catch (err) {
      setError('Something went wrong placing your order. Please try again.')
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
                      {submitting ? 'Placing Order…' : 'Complete Order'}
                    </button>
                    <p className="text-xs text-2C2C2C/50 text-center mt-3">
                      Payment isn't collected online yet — we'll follow up by email/phone to confirm and arrange payment.
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
                <div className="border-t border-E8D9C4 mt-4 pt-4 flex justify-between font-semibold">
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
