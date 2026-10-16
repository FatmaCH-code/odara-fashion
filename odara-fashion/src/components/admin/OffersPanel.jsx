import { useEffect, useState } from 'react'
import { loadSiteSettings, adminSaveSiteSettings } from '../../services/settings'

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

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const percent = Math.min(90, Math.max(1, parseInt(form.welcomeOffer.percent) || 10))
      const code = (form.welcomeOffer.code || '').trim().toUpperCase().replace(/\s+/g, '') || 'WELCOME10'
      const delaySeconds = Math.min(120, Math.max(1, parseInt(form.welcomeOffer.delaySeconds) || 6))
      const next = { ...form, welcomeOffer: { ...form.welcomeOffer, percent, code, delaySeconds } }
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
      <h1 className="text-2xl font-playfair mb-2">Offers</h1>
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
            <p className="text-xs text-2C2C2C/50">A thin line of text above the menu on every page.</p>
          </div>
          <Toggle on={form.announcement.enabled} onChange={(v) => setBar({ enabled: v })} label="Announcement bar on/off" />
        </div>
        <label className="admin-label">Text</label>
        <input className="admin-input" value={form.announcement.text} onChange={(e) => setBar({ text: e.target.value })} />
        <p className="text-xs text-2C2C2C/50 mt-2">If you change the discount %, update this text too.</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-3">{message}</p>}
      <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}
