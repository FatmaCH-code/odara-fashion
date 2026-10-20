import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, ChevronDown } from 'lucide-react'
import { useCartStore, getLineId } from '../store/cartStore'
import { createOrder } from '../services/orders'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { shippingFor } from '../utils/pricing'
import { validatePromo } from '../services/promo'

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'],
  ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'],
  ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'],
  ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Other']
const EMPTY = { name: '', email: '', phone: '', country: 'United States', otherCountry: '', address: '', apt: '', city: '', state: '', postal: '' }
const STORE_KEY = 'odara-checkout'
const money = (n) => `$${Number(n).toFixed(2)}`

const loadForm = () => {
  try { return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') } } catch { return EMPTY }
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const clearCart = useCartStore(state => state.clearCart)
  const { settings } = useSiteSettings()

  // Kept for the session, so a refresh (or a trip back to the bag) doesn't lose what was typed.
  const [form, setForm] = useState(loadForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)

  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState(null) // { code, percent } once a valid code is applied
  const [promoMsg, setPromoMsg] = useState('')

  useEffect(() => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(form)) } catch { /* private mode */ } }, [form])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discount = promo ? Math.round(subtotal * promo.percent) / 100 : 0
  const isUS = form.country === 'United States'
  // Shipping depends on how far the address is from Ohio (null until a US state is picked).
  const shipping = shippingFor(subtotal - discount, settings.shipping, { country: form.country, state: isUS ? form.state : '' })
  const total = subtotal - discount + (shipping || 0)
  const freeOver = Number(settings.shipping.freeOver || 0)
  const canFreeShip = freeOver > 0 && (settings.shipping.byZone !== false || Number(settings.shipping.flatFee || 0) > 0)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { setError('Your bag is empty.'); return }
    setSubmitting(true)
    setError('')

    const country = isUS ? 'United States' : (form.country === 'Other' ? form.otherCountry.trim() : form.country)
    const line1 = [form.address.trim(), form.apt.trim()].filter(Boolean).join(', ')
    const address = `${line1}, ${form.city.trim()}${form.state ? `, ${form.state}` : ''} ${form.postal.trim()}, ${country}`

    try {
      const order = await createOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address,
        // The server looks up the real price from the product id — these prices are never trusted.
        items: items.map(i => ({
          id: i.id, name: i.name, price: i.price, quantity: i.quantity,
          color: i.color, size: i.size, category: i.category, blend: i.blend,
        })),
        promoCode: promo ? promo.code : null,
      })
      try { sessionStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
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
      // Messages like "Only 1 of … left in stock" come straight from the server and are meant to be read.
      setError(err.message || 'Something went wrong placing your order. Please try again.')
      setSubmitting(false)
    }
  }

  const payLabel = submitting
    ? (paymentsEnabled ? 'Redirecting to payment…' : 'Placing order…')
    : (paymentsEnabled ? 'Continue to payment' : 'Place order')

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container-premium checkout-empty">
          <h1>Your bag is empty</h1>
          <p>Add something you love, then come back to check out.</p>
          <Link to="/shop" className="btn-gold">Continue shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container-premium">
        <ol className="checkout-steps" aria-label="Checkout progress">
          <li><Link to="/cart">Bag</Link></li>
          <li className="is-current" aria-current="step">Details</li>
          <li>Payment</li>
        </ol>

        <div className="checkout-grid">
          {/* Order summary: collapsible on phones, always open on desktop */}
          <aside className="checkout-summary">
            <button type="button" className="checkout-summary-toggle" onClick={() => setSummaryOpen(o => !o)} aria-expanded={summaryOpen}>
              <span>{summaryOpen ? 'Hide' : 'Show'} order summary <ChevronDown className={`w-4 h-4 ${summaryOpen ? 'is-open' : ''}`} /></span>
              <strong>{money(total)}</strong>
            </button>

            <div className={`checkout-summary-body ${summaryOpen ? 'is-open' : ''}`}>
              <h2 className="checkout-summary-title">Order summary</h2>
              <ul className="checkout-items">
                {items.map(i => (
                  <li key={getLineId(i)}>
                    <span className="checkout-thumb">
                      {i.image ? <img src={i.image} alt="" /> : null}
                      <em>{i.quantity}</em>
                    </span>
                    <span className="checkout-item-name">{i.name}</span>
                    <span>{money(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              {promo ? (
                <div className="checkout-row">
                  <span>Discount ({promo.code}) <button type="button" className="promo-remove" onClick={() => setPromo(null)}>remove</button></span>
                  <span>−{money(discount)}</span>
                </div>
              ) : (
                <div className="checkout-promo">
                  <div className="promo-row">
                    <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Discount code" aria-label="Discount code" autoCapitalize="characters" />
                    <button type="button" onClick={() => applyPromo(promoInput)}>Apply</button>
                  </div>
                  {promoMsg && <p className="text-xs text-red-600 mt-2">{promoMsg}</p>}
                </div>
              )}

              <div className="checkout-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="checkout-row"><span>Shipping</span><span>{shipping === null ? 'Select your state' : shipping > 0 ? money(shipping) : 'Free'}</span></div>
              {canFreeShip && shipping !== 0 && (
                <p className="checkout-hint">Add {money(freeOver - (subtotal - discount))} more for free shipping.</p>
              )}
              <div className="checkout-row checkout-total"><span>Total</span><span>{money(total)}</span></div>
            </div>
          </aside>

          {/* Details form */}
          <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
            <h2>Contact</h2>
            <div className="field">
              <label htmlFor="co-email">Email</label>
              <input id="co-email" type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="co-phone">Phone <span>(for delivery updates)</span></label>
              <input id="co-phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 555-0100" />
            </div>

            <h2>Shipping address</h2>
            <div className="field">
              <label htmlFor="co-country">Country</label>
              <select id="co-country" autoComplete="country-name" value={form.country} onChange={set('country')}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {form.country === 'Other' && (
              <div className="field">
                <label htmlFor="co-other">Country name</label>
                <input id="co-other" required value={form.otherCountry} onChange={set('otherCountry')} />
              </div>
            )}
            <div className="field">
              <label htmlFor="co-name">Full name</label>
              <input id="co-name" required autoComplete="name" value={form.name} onChange={set('name')} placeholder="First and last name" />
            </div>
            <div className="field">
              <label htmlFor="co-address">Address</label>
              <input id="co-address" required autoComplete="address-line1" value={form.address} onChange={set('address')} placeholder="Street address" />
            </div>
            <div className="field">
              <label htmlFor="co-apt">Apartment, suite, etc. <span>(optional)</span></label>
              <input id="co-apt" autoComplete="address-line2" value={form.apt} onChange={set('apt')} />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="co-city">City</label>
                <input id="co-city" required autoComplete="address-level2" value={form.city} onChange={set('city')} />
              </div>
              <div className="field">
                <label htmlFor="co-state">{isUS ? 'State' : 'State / region'}</label>
                {isUS ? (
                  <select id="co-state" required autoComplete="address-level1" value={form.state} onChange={set('state')}>
                    <option value="">Select…</option>
                    {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                ) : (
                  <input id="co-state" autoComplete="address-level1" value={form.state} onChange={set('state')} />
                )}
              </div>
              <div className="field">
                <label htmlFor="co-zip">{isUS ? 'ZIP code' : 'Postal code'}</label>
                <input id="co-zip" required autoComplete="postal-code" inputMode={isUS ? 'numeric' : 'text'} value={form.postal} onChange={set('postal')} />
              </div>
            </div>

            {error && <p className="checkout-error" role="alert">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-gold checkout-submit">{payLabel}</button>
            <p className="checkout-secure">
              <Lock className="w-3.5 h-3.5" />
              {paymentsEnabled
                ? "Secure payment by Stripe — pay by card, Apple Pay or Google Pay on the next page."
                : "Payment isn't collected online yet — we'll follow up by email/phone to confirm and arrange payment."}
            </p>
          </form>
        </div>
      </div>

      {/* Phones: the total and the pay button stay in reach at the bottom of the screen */}
      <div className="checkout-sticky">
        <div><span>Total</span><strong>{money(total)}</strong></div>
        <button type="submit" form="checkout-form" disabled={submitting} className="btn-gold">{payLabel}</button>
      </div>
    </div>
  )
}
