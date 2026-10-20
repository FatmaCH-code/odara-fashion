import { useEffect, useState } from 'react'
import { loadSiteSettings, adminSaveSiteSettings } from '../../services/settings'
import { ZONES, DEFAULT_ZONE_FEES, DEFAULT_INTERNATIONAL_FEE } from '../../utils/shippingZones'

const Toggle = ({ on, onChange, label }) => (
  <button type="button" className={`admin-toggle ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)} aria-label={label} aria-pressed={on}>
    <span className="admin-toggle-knob" />
  </button>
)

export default function OffersPanel() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadSiteSettings(true).then(setForm) }, [])

  if (!form) return <p className="text-2C2C2C/50">Loading…</p>

  const setOffer = (patch) => setForm(f => ({ ...f, welcomeOffer: { ...f.welcomeOffer, ...patch } }))
  const setBar = (patch) => setForm(f => ({ ...f, announcement: { ...f.announcement, ...patch } }))
  const setShip = (patch) => setForm(f => ({ ...f, shipping: { ...f.shipping, ...patch } }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const percent = Math.min(90, Math.max(1, parseInt(form.welcomeOffer.percent) || 10))
      const code = (form.welcomeOffer.code || '').trim().toUpperCase().replace(/\s+/g, '') || 'WELCOME10'
      const delaySeconds = Math.min(120, Math.max(1, parseInt(form.welcomeOffer.delaySeconds) || 6))
      const flatFee = Math.min(500, Math.max(0, parseFloat(form.shipping.flatFee) || 0))
      const freeOver = Math.max(0, parseFloat(form.shipping.freeOver) || 0)
      const zones = ZONES.map((_, i) => Math.min(500, Math.max(0, parseFloat((form.shipping.zones || [])[i]) || 0)))
      const international = Math.min(500, Math.max(0, parseFloat(form.shipping.international) || 0))
      const next = { ...form, welcomeOffer: { ...form.welcomeOffer, percent, code, delaySeconds }, shipping: { flatFee, freeOver, byZone: form.shipping.byZone !== false, zones, international } }
      await adminSaveSiteSettings(next)
      setForm(next)
      setMessage('Saved — the site updates on the next page load.')
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="max-w-2xl">
      <h1 className="text-2xl font-playfair mb-2">Offers &amp; shipping</h1>
      <p className="text-2C2C2C/60 text-sm mb-8">
        The pop-up that appears a few seconds after someone lands on the site, and the bar at the very top. Emails
        collected by the pop-up appear under <strong>Subscribers</strong>.
      </p>

      <div className="admin-panel-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-playfair text-lg">Welcome pop-up</h2>
            <p className="text-xs text-2C2C2C/50">Asks for an email, then reveals the discount code.</p>
          </div>
          <Toggle on={form.welcomeOffer.enabled} onChange={(v) => setOffer({ enabled: v })} label="Welcome pop-up on/off" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="admin-label">Discount %</label>
            <input type="number" min="1" max="90" className="admin-input" value={form.welcomeOffer.percent} onChange={(e) => setOffer({ percent: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Code</label>
            <input className="admin-input" value={form.welcomeOffer.code} onChange={(e) => setOffer({ code: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Shows after (sec)</label>
            <input type="number" min="1" max="120" className="admin-input" value={form.welcomeOffer.delaySeconds} onChange={(e) => setOffer({ delaySeconds: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-2C2C2C/50 mt-3">
          Each email address can use the code once. It's applied automatically at checkout for people who got it from the pop-up.
        </p>
      </div>

      <div className="admin-panel-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-playfair text-lg">Announcement bar</h2>
            <p className="text-xs text-2C2C2C/50">A thin rotating line above the menu on every page. Free shipping and the welcome discount appear here by themselves when they are switched on.</p>
          </div>
          <Toggle on={form.announcement.enabled} onChange={(v) => setBar({ enabled: v })} label="Announcement bar on/off" />
        </div>
        <label className="admin-label">Extra message (optional)</label>
        <input className="admin-input" value={form.announcement.text} onChange={(e) => setBar({ text: e.target.value })} />
        <p className="text-xs text-2C2C2C/50 mt-2">Leave empty to show only your real offers.</p>
      </div>

      <div className="admin-panel-card mb-6">
        <h2 className="font-playfair text-lg mb-1">Shipping</h2>
        <p className="text-xs text-2C2C2C/50 mb-4">Added to every order at checkout (cart, Stripe and your orders all use the same amount).</p>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Charge by distance from Ohio</p>
            <p className="text-xs text-2C2C2C/50">The farther the customer's state, the higher the fee. Turn off to charge one flat fee.</p>
          </div>
          <Toggle on={form.shipping.byZone !== false} onChange={(v) => setShip({ byZone: v })} label="Shipping by distance" />
        </div>

        {form.shipping.byZone !== false ? (
          <div className="space-y-3 mb-4">
            {ZONES.map((z, i) => (
              <div key={z.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{z.name}</p>
                  <p className="text-xs text-2C2C2C/50">{z.states}</p>
                </div>
                <span className="text-sm text-2C2C2C/50">$</span>
                <input type="number" min="0" max="500" step="0.01" className="admin-input" style={{ width: 96 }}
                  value={(form.shipping.zones || DEFAULT_ZONE_FEES)[i] ?? DEFAULT_ZONE_FEES[i]}
                  onChange={(e) => setShip({ zones: ZONES.map((_, k) => (k === i ? e.target.value : (form.shipping.zones || DEFAULT_ZONE_FEES)[k])) })} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Outside the United States</p>
                <p className="text-xs text-2C2C2C/50">Canada, UK, Australia, UAE, Saudi Arabia and others</p>
              </div>
              <span className="text-sm text-2C2C2C/50">$</span>
              <input type="number" min="0" max="500" step="0.01" className="admin-input" style={{ width: 96 }}
                value={form.shipping.international ?? DEFAULT_INTERNATIONAL_FEE} onChange={(e) => setShip({ international: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="admin-label">Flat shipping fee per order ($)</label>
            <input type="number" min="0" max="500" step="0.01" className="admin-input" value={form.shipping.flatFee} onChange={(e) => setShip({ flatFee: e.target.value })} />
          </div>
        )}

        <div>
          <label className="admin-label">Free shipping on orders over ($)</label>
          <input type="number" min="0" step="0.01" className="admin-input" value={form.shipping.freeOver} onChange={(e) => setShip({ freeOver: e.target.value })} />
        </div>
        <p className="text-xs text-2C2C2C/50 mt-3">
          Leave “free over” at <strong>0</strong> to always charge shipping. The free-shipping amount is checked after any discount code.
          Put a fee of <strong>0</strong> on a zone to ship free there.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-3">{message}</p>}
      <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}
